"""
AI Scoper Scheduler Service

This scheduler runs scraping and email sending based on admin-configured settings.
- Scraping runs 3 hours before the configured email time
- Email sending runs at the configured email time
- Frequency can be: daily, every_2_days, weekly, disabled

The scheduler checks every minute if it should run an action.
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple

# Add parent directory to path for imports when running as module
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from apscheduler.schedulers.blocking import BlockingScheduler
from apscheduler.triggers.interval import IntervalTrigger

from flask import Flask
from core.config import CONFIG
from core.models import db, AppSettings, ScrapeLog, MailLog

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('scheduler')

# Tick counter for status logs
_tick_count = 0


def create_scheduler_app() -> Flask:
    """Create a minimal Flask app for scheduler database access."""
    from dotenv import load_dotenv
    load_dotenv()
    
    app = Flask(__name__)
    app.config.from_object(CONFIG)
    db.init_app(app)
    
    return app


def parse_time(time_str: str) -> Tuple[int, int]:
    """Parse time string like '09:00' into (hour, minute)."""
    try:
        parts = time_str.split(':')
        return int(parts[0]), int(parts[1])
    except (ValueError, IndexError):
        logger.error(f"Invalid time format: {time_str}, defaulting to 09:00")
        return 9, 0


def is_send_day(frequency: str) -> bool:
    """
    Check if today is a day when we should send emails based on frequency.
    
    - daily: every day
    - every_2_days: even days of the month (2, 4, 6, 8, ...)
    - weekly: Mondays (weekday = 0)
    - disabled: never
    """
    today = datetime.now()
    
    if frequency == 'daily':
        return True
    elif frequency == 'every_2_days':
        # Run on even days of the month
        return today.day % 2 == 0
    elif frequency == 'weekly':
        # Run on Mondays
        return today.weekday() == 0
    elif frequency == 'disabled':
        return False
    else:
        logger.warning(f"Unknown frequency: {frequency}, treating as disabled")
        return False


def already_scraped_today() -> bool:
    """Check if scraping was already done today."""
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    log = ScrapeLog.query.filter(
        ScrapeLog.executed_at >= today_start
    ).first()
    
    return log is not None


def already_sent_today() -> bool:
    """Check if emails were already sent today."""
    today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    log = MailLog.query.filter(
        MailLog.executed_at >= today_start
    ).first()
    
    return log is not None


def run_scraping():
    """Execute the scraping operation for all subscribed users."""
    from services.scrape import scrape_offers_for_all_users
    
    logger.info("=" * 60)
    logger.info("🔄 STARTING SCHEDULED SCRAPING")
    logger.info("=" * 60)
    
    try:
        result = scrape_offers_for_all_users(print_logs=True)
        
        if 'error' in result:
            logger.error(f"❌ Scraping failed: {result['error']}")
        else:
            logger.info(f"✅ Scraping completed successfully!")
            logger.info(f"   • Total users: {result['total_users']}")
            logger.info(f"   • Successful: {result['successful_scrapes']}")
            logger.info(f"   • Failed: {result['failed_scrapes']}")
            logger.info(f"   • Total offers: {result['total_scraped_offers']}")
            logger.info(f"   • Duration: {result.get('total_duration_millis', 0) / 1000:.1f}s")
            
    except Exception as e:
        logger.exception(f"❌ Unexpected error during scraping: {e}")


def run_email_sending():
    """Execute the email sending operation for all users."""
    from services.mail import send_user_offer_emails
    
    logger.info("=" * 60)
    logger.info("📧 STARTING SCHEDULED EMAIL SENDING")
    logger.info("=" * 60)
    
    try:
        result = send_user_offer_emails(
            base_url=CONFIG.BASE_URL,
            circle_url=CONFIG.CIRCLE_URL
        )
        
        if result.get('error'):
            logger.error(f"❌ Email sending failed: {result['error']}")
        else:
            summary = result.get('summary', {})
            logger.info(f"✅ Email sending completed!")
            logger.info(f"   • Total sent: {summary.get('total_sent', 0)}")
            logger.info(f"   • Total failed: {summary.get('total_failed', 0)}")
            logger.info(f"   • Subscribed users: {summary.get('subscribed_users', 0)}")
            logger.info(f"   • Non-subscribed (promo): {summary.get('non_subscribed_users', 0)}")
            
    except Exception as e:
        logger.exception(f"❌ Unexpected error during email sending: {e}")


def log_status(now: datetime, settings: AppSettings, scrape_hour: int, scrape_minute: int, 
               email_hour: int, email_minute: int, scraped_today: bool, sent_today: bool):
    """Log current scheduler status for debugging."""
    logger.info("-" * 60)
    logger.info(f"📊 SCHEDULER STATUS")
    logger.info(f"   🕐 Current time: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"   📅 Day of week: {now.strftime('%A')} (weekday={now.weekday()})")
    logger.info(f"   📅 Day of month: {now.day}")
    logger.info(f"   ⚙️  Frequency: {settings.email_frequency}")
    logger.info(f"   ⚙️  Configured email time: {settings.email_daytime}")
    logger.info(f"   🔄 Scrape scheduled at: {scrape_hour:02d}:{scrape_minute:02d}")
    logger.info(f"   📧 Email scheduled at: {email_hour:02d}:{email_minute:02d}")
    logger.info(f"   📊 Is send day: {is_send_day(settings.email_frequency)}")
    logger.info(f"   ✓ Already scraped today: {scraped_today}")
    logger.info(f"   ✓ Already sent today: {sent_today}")
    logger.info("-" * 60)


def scheduler_tick(app: Flask):
    """
    Main scheduler tick - runs every minute.
    Checks if scraping or email sending should be executed.
    """
    global _tick_count
    _tick_count += 1
    
    with app.app_context():
        try:
            # Get current time FIRST
            now = datetime.now()
            current_hour = now.hour
            current_minute = now.minute
            
            # Get current settings from database
            settings = AppSettings.query.first()
            
            if not settings:
                if _tick_count % 15 == 0:  # Log every 15 minutes
                    logger.warning(f"⚠️ [{now.strftime('%H:%M')}] No settings found in database")
                return
            
            frequency = settings.email_frequency
            email_time = settings.email_daytime or '09:00'
            
            # Parse configured time
            email_hour, email_minute = parse_time(email_time)
            scrape_hours_before = settings.scrape_hours_before or 3
            scrape_hour = (email_hour - scrape_hours_before) % 24

            # Check status
            scraped_today = already_scraped_today()
            sent_today = already_sent_today()
            
            # Log status every 15 minutes OR on the hour
            if _tick_count % 15 == 0 or current_minute == 0:
                log_status(now, settings, scrape_hour, email_minute, 
                          email_hour, email_minute, scraped_today, sent_today)
            
            # Check if disabled
            if frequency == 'disabled':
                if _tick_count % 60 == 0:  # Log once per hour
                    logger.info(f"⏸️ [{now.strftime('%H:%M')}] Scheduler is DISABLED")
                return
            
            # Check if today is a send day
            if not is_send_day(frequency):
                if _tick_count % 60 == 0:  # Log once per hour
                    logger.info(f"📅 [{now.strftime('%H:%M')}] Today is NOT a send day (frequency: {frequency})")
                return
            
            # === CHECK SCRAPE TIME ===
            is_scrape_time = (current_hour == scrape_hour and current_minute == email_minute)
            
            logger.debug(f"[{now.strftime('%H:%M')}] Checking scrape: current={current_hour:02d}:{current_minute:02d}, target={scrape_hour:02d}:{email_minute:02d}, match={is_scrape_time}")
            
            if is_scrape_time:
                logger.info(f"⏰ [{now.strftime('%H:%M')}] SCRAPE TIME MATCHED!")
                if scraped_today:
                    logger.info(f"   ⏭️ Skipping - already scraped today")
                else:
                    logger.info(f"   🚀 Starting scrape...")
                    run_scraping()
            
            # === CHECK EMAIL TIME ===
            is_email_time = (current_hour == email_hour and current_minute == email_minute)
            
            logger.debug(f"[{now.strftime('%H:%M')}] Checking email: current={current_hour:02d}:{current_minute:02d}, target={email_hour:02d}:{email_minute:02d}, match={is_email_time}")
            
            if is_email_time:
                logger.info(f"⏰ [{now.strftime('%H:%M')}] EMAIL TIME MATCHED!")
                if sent_today:
                    logger.info(f"   ⏭️ Skipping - already sent today")
                else:
                    logger.info(f"   🚀 Starting email sending...")
                    run_email_sending()

            # === FALLBACK: HOURLY CHECK ===
            # If scraping finished but emails weren't sent (e.g. scrape took longer than expected),
            # check every hour and send if ready.
            is_past_email_time = (current_hour > email_hour or
                                  (current_hour == email_hour and current_minute > email_minute))

            if current_minute == 0 and is_past_email_time and not is_email_time:
                if scraped_today and not already_sent_today():
                    logger.info(f"🔄 [{now.strftime('%H:%M')}] FALLBACK: Scraped today but not sent yet — sending now!")
                    run_email_sending()

        except Exception as e:
            logger.exception(f"❌ Error in scheduler tick: {e}")


def start_scheduler():
    """Start the scheduler with minute-by-minute checks."""
    logger.info("=" * 60)
    logger.info("🚀 AI SCOPER SCHEDULER STARTING")
    logger.info("=" * 60)
    
    # Log system time info
    now = datetime.now()
    logger.info(f"🕐 System time: {now.strftime('%Y-%m-%d %H:%M:%S')}")
    logger.info(f"🌍 Timezone info: {now.astimezone().tzinfo}")
    
    app = create_scheduler_app()
    
    # Verify database connection and show current config
    with app.app_context():
        try:
            settings = AppSettings.query.first()
            if settings:
                logger.info("✅ Connected to database successfully")
                logger.info("")
                logger.info("📋 CURRENT CONFIGURATION:")
                logger.info(f"   • Frequency: {settings.email_frequency}")
                logger.info(f"   • Email time (from DB): '{settings.email_daytime}'")
                
                email_hour, email_minute = parse_time(settings.email_daytime or '09:00')
                scrape_hours_before = settings.scrape_hours_before or 3
                scrape_hour = (email_hour - scrape_hours_before) % 24
                
                logger.info(f"   • Parsed email time: {email_hour:02d}:{email_minute:02d}")
                logger.info(f"   • Calculated scrape time: {scrape_hour:02d}:{email_minute:02d}")
                logger.info("")
                
                # Show today's status
                scraped = already_scraped_today()
                sent = already_sent_today()
                is_send = is_send_day(settings.email_frequency)
                
                logger.info("📊 TODAY'S STATUS:")
                logger.info(f"   • Is send day: {is_send}")
                logger.info(f"   • Already scraped: {scraped}")
                logger.info(f"   • Already sent emails: {sent}")
                logger.info("")
                
                # Calculate time until next action
                if settings.email_frequency != 'disabled' and is_send:
                    now = datetime.now()
                    
                    # Time until scrape
                    scrape_target = now.replace(hour=scrape_hour, minute=email_minute, second=0, microsecond=0)
                    if scrape_target <= now:
                        scrape_target += timedelta(days=1)
                    time_to_scrape = scrape_target - now
                    
                    # Time until email
                    email_target = now.replace(hour=email_hour, minute=email_minute, second=0, microsecond=0)
                    if email_target <= now:
                        email_target += timedelta(days=1)
                    time_to_email = email_target - now
                    
                    logger.info("⏰ NEXT SCHEDULED ACTIONS:")
                    if not scraped:
                        logger.info(f"   • Scrape in: {time_to_scrape} (at {scrape_target.strftime('%H:%M')})")
                    else:
                        logger.info(f"   • Scrape: DONE for today")
                    if not sent:
                        logger.info(f"   • Email in: {time_to_email} (at {email_target.strftime('%H:%M')})")
                    else:
                        logger.info(f"   • Email: DONE for today")
                else:
                    logger.info("⏸️ No actions scheduled (disabled or not a send day)")
                    
            else:
                logger.warning("⚠️ No settings found in database - waiting for configuration")
        except Exception as e:
            logger.error(f"❌ Failed to connect to database: {e}")
            raise
    
    # Create scheduler
    scheduler = BlockingScheduler()
    
    # Add job that runs every minute
    scheduler.add_job(
        func=lambda: scheduler_tick(app),
        trigger=IntervalTrigger(minutes=1),
        id='scheduler_tick',
        name='Check if scraping or email sending should run',
        replace_existing=True,
        max_instances=1  # Prevent overlapping executions
    )
    
    logger.info("")
    logger.info("=" * 60)
    logger.info("⏳ SCHEDULER RUNNING")
    logger.info("   • Checking every minute")
    logger.info("   • Status log every 15 minutes")
    logger.info("   • Press Ctrl+C to stop")
    logger.info("=" * 60)
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("🛑 Scheduler stopped gracefully")


if __name__ == '__main__':
    start_scheduler()
