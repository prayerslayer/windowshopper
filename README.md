# windowshopper

Lazy UI discovery for STUPS infrastructure.

## How does it work

* Get all apps from Kio
* if `GET ${app.service_url}` returns HTML
    1. make a screenshot with phantomjs
    2. upload to s3


## Caveats

* Won't find UIs secured on network level, e.g. security groups, firewalls...
* Does not find UIs living in non-root path. This could be tackled together with tintwip, where we would look for unsecured endpoints with text/html response.
* Self signed certificates?

## Todo

* Ability to "fav" UIs
