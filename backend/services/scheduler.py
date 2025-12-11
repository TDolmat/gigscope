"""
AI Scoper Scheduler Service

This scheduler runs scraping and email sending based on admin-configured settings.
- Scraping runs 1 hour before the configured email time
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
    logger.info("STARTING SCHEDULED SCRAPING")
    logger.info("=" * 60)
    
    try:
        result = scrape_offers_for_all_users(print_logs=True)
        
        if 'error' in result:
            logger.error(f"Scraping failed: {result['error']}")
        else:
            logger.info(f"Scraping completed successfully!")
            logger.info(f"  - Total users: {result['total_users']}")
            logger.info(f"  - Successful: {result['successful_scrapes']}")
            logger.info(f"  - Failed: {result['failed_scrapes']}")
            logger.info(f"  - Total offers: {result['total_scraped_offers']}")
            logger.info(f"  - Duration: {result.get('total_duration_millis', 0) / 1000:.1f}s")
            
    except Exception as e:
        logger.exception(f"Unexpected error during scraping: {e}")


def run_email_sending():
    """Execute the email sending operation for all users."""
    from services.mail import send_user_offer_emails
    
    logger.info("=" * 60)
    logger.info("STARTING SCHEDULED EMAIL SENDING")
    logger.info("=" * 60)
    
    try:
        result = send_user_offer_emails(
            base_url=CONFIG.BASE_URL,
            circle_url=CONFIG.CIRCLE_URL
        )
        
        if result.get('error'):
            logger.error(f"Email sending failed: {result['error']}")
        else:
            summary = result.get('summary', {})
            logger.info(f"Email sending completed!")
            logger.info(f"  - Total sent: {summary.get('total_sent', 0)}")
            logger.info(f"  - Total failed: {summary.get('total_failed', 0)}")
            logger.info(f"  - Subscribed users: {summary.get('subscribed_users', 0)}")
            logger.info(f"  - Non-subscribed (promo): {summary.get('non_subscribed_users', 0)}")
            
    except Exception as e:
        logger.exception(f"Unexpected error during email sending: {e}")


def scheduler_tick(app: Flask):
    """
    Main scheduler tick - runs every minute.
    Checks if scraping or email sending should be executed.
    """
    with app.app_context():
        try:
            # Get current settings from database
            settings = AppSettings.query.first()
            
            if not settings:
                return  # Silent - no settings yet
            
            frequency = settings.email_frequency
            email_time = settings.email_daytime or '09:00'
            
            # Check if disabled
            if frequency == 'disabled':
                return  # Silent - disabled
            
            # Check if today is a send day
            if not is_send_day(frequency):
                return  # Silent - not a send day
            
            # Parse configured time
            email_hour, email_minute = parse_time(email_time)
            scrape_hour = email_hour - 1
            if scrape_hour < 0:
                scrape_hour = 23  # If email at 00:xx, scrape at 23:xx (edge case)
            
            # Get current time
            now = datetime.now()
            current_hour = now.hour
            current_minute = now.minute
            
            # Check if it's time to scrape (1 hour before email time)
            # Special case: if email at 00:xx, scrape should be at 23:xx the same day
            # (we check every minute so we won't miss it)
            is_scrape_time = (current_hour == scrape_hour and current_minute == email_minute)
            
            if is_scrape_time:
                if already_scraped_today():
                    logger.info("Scraping already done today, skipping")
                else:
                    logger.info(f"⏰ It's scrape time! ({scrape_hour:02d}:{email_minute:02d})")
                    run_scraping()
            
            # Check if it's time to send emails
            is_email_time = (current_hour == email_hour and current_minute == email_minute)
            
            if is_email_time:
                if already_sent_today():
                    logger.info("Emails already sent today, skipping")
                else:
                    logger.info(f"📧 It's email time! ({email_hour:02d}:{email_minute:02d})")
                    run_email_sending()
                    
        except Exception as e:
            logger.exception(f"Error in scheduler tick: {e}")


def start_scheduler():
    """Start the scheduler with minute-by-minute checks."""
    logger.info("=" * 60)
    logger.info("🚀 AI SCOPER SCHEDULER STARTING")
    logger.info("=" * 60)
    
    app = create_scheduler_app()
    
    # Verify database connection and show current config
    with app.app_context():
        try:
            settings = AppSettings.query.first()
            if settings:
                logger.info("✅ Connected to database successfully")
                logger.info("📋 Current settings:")
                logger.info(f"   • Frequency: {settings.email_frequency}")
                logger.info(f"   • Email time: {settings.email_daytime or '09:00'}")
                
                email_hour, email_minute = parse_time(settings.email_daytime or '09:00')
                scrape_hour = email_hour - 1 if email_hour > 0 else 23
                logger.info(f"   • Scrape time: {scrape_hour:02d}:{email_minute:02d} (1h before)")
                
                # Show next scheduled run info
                if settings.email_frequency != 'disabled':
                    if is_send_day(settings.email_frequency):
                        logger.info(f"   • Today IS a send day ({settings.email_frequency})")
                    else:
                        logger.info(f"   • Today is NOT a send day ({settings.email_frequency})")
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
    
    logger.info("=" * 60)
    logger.info("⏳ Scheduler running - checking every minute")
    logger.info("   Press Ctrl+C to stop")
    logger.info("=" * 60)
    
    try:
        scheduler.start()
    except (KeyboardInterrupt, SystemExit):
        logger.info("🛑 Scheduler stopped gracefully")


if __name__ == '__main__':
    start_scheduler()

