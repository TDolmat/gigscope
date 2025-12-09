
COMMUNITY_ID = 445063

TOKEN_API_V1 = "jq6mUa12gLcEB8b51MbJCQsUvdXYTHF2"
TOKEN_API_V2 = "QTJD9RNZt5EmcjjbQEnx7tmhqJhyeyKk"

MAX_PAGES = 1000


import requests


TOKEN = TOKEN_API_V1
HEADERS = {
    "Authorization": f"Bearer {TOKEN}",
    "Content-Type": "application/json"
}

query_params = {
    "sort": "latest",
    "include": "roles",
    "per_page": 100,
}

url = f"https://app.circle.so/api/v1/community_members"
# url = f"https://app.circle.so/api/v1/community_member_subscriptions?community_id={COMMUNITY_ID}"

for page in range(1, MAX_PAGES):
    query_params["page"] = page
    response = requests.get(url, headers=HEADERS, params=query_params)

    if len(response.json()) == 0:
        break

    print(len(response.json()))

# response = requests.get(url, headers=HEADERS, params=query_params)



# print(len(response.json()))

# for row in response.json():
#     print(f"{row['first_name']} {row['last_name']}")
#     print(f"{row['email']}")
#     # print(row['is_admin'])
#     print(row['active'])
#     # print(row['is_admin'])/

#     print("--------------------------------")