OPTIONS http://localhost:8080/user
HTTP 200
[Asserts]
header "Allow" == "POST"

OPTIONS http://localhost:8080/user/username
HTTP 200
[Asserts]
header "Allow" contains "GET"
header "Allow" contains "PUT"
header "Allow" contains "PATCH"
header "Allow" contains "DELETE"

GET http://localhost:8080/user/POTUS
HTTP 404

POST http://localhost:8080/user
Content-Type: application/json
{
    "username": "POTUS",
    "name": "Emilio Morejon"
}
HTTP 303