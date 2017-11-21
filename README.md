<div align="center"><img src="https://user-images.githubusercontent.com/1473072/33020417-45869a00-ce0f-11e7-9faa-368445d463f7.gif" alt="Stars counter"/></div>
<h1 align="center">GitHub Trending Repos</h1>
<a href="https://circleci.com/gh/vitalets/github-trending-repos"><img src="https://circleci.com/gh/vitalets/github-trending-repos.svg?style=svg" alt="CircleCI"/></a>
<a href="https://twitter.com/intent/tweet?url=https%3A%2F%2Fgithub.com%2Fvitalets%2Fgithub-trending-repos&via=vitpotapov&text=Stay%20notified%20about%20trending%20GitHub%20repositories%20in%20your%20favorite%20programming%20language%21&hashtags=github%2Ctrending"><img align="right" alt="Tweet" src="https://img.shields.io/twitter/url/http/shields.io.svg?style=social"/></a>

A way to subscribe on [new trending repositories](https://github.com/trending) in your favorite
programming language on GitHub. Updates come as [GitHub notifications] once a day or week.

## How it works
1. Every issue in this repo is related to the particular programming language
2. You can subscribe to an issue by pressing <img alt="subscribe button" valign="middle" src="https://user-images.githubusercontent.com/1473072/32487280-46f4489c-c3ba-11e7-82d7-cfe073cac8d1.png"> button
3. Scheduled scripts scrape trending repos page every day and week
4. If there are new repos - the script drops a comment to the corresponding issue
5. All issue subscribers receive GitHub notification in web interface <img alt="notification icon" valign="bottom" src="https://user-images.githubusercontent.com/1473072/32723023-01555c78-c87d-11e7-8190-6bf3bb0ec405.png"> or by email

## Schedule
You can choose the following subscription types:
* Daily: runs **every day at 00:00 UTC**, see issues labeled with [trending-daily](https://github.com/vitalets/github-trending-repos/labels/trending-daily)
* Weekly: runs **every friday at 02:00 UTC**, see issues labeled with [trending-weekly](https://github.com/vitalets/github-trending-repos/labels/trending-weekly)

## Examples
Notification in web interface:  
![Example of web notification](https://user-images.githubusercontent.com/1473072/32488601-4295b138-c3be-11e7-8eb2-18a624c54ca2.png)

The comment with new repos:  
![Example of comment](https://user-images.githubusercontent.com/1473072/33029917-f054b67c-ce2a-11e7-9b42-a7ee16d98228.png)

## Available languages
Many languages are available for subscription including the [fifteen most popular languages on GitHub](https://octoverse.github.com/):

* [JavaScript](https://github.com/vitalets/github-trending-repos/issues/5)
* [Python](https://github.com/vitalets/github-trending-repos/issues/7)
* [Java](https://github.com/vitalets/github-trending-repos/issues/8)
* [Ruby](https://github.com/vitalets/github-trending-repos/issues/9)
* [PHP](https://github.com/vitalets/github-trending-repos/issues/10)
* [C++](https://github.com/vitalets/github-trending-repos/issues/29)
* [CSS](https://github.com/vitalets/github-trending-repos/issues/30)
* [C#](https://github.com/vitalets/github-trending-repos/issues/31)
* [Go](https://github.com/vitalets/github-trending-repos/issues/32)
* [C](https://github.com/vitalets/github-trending-repos/issues/33)
* [TypeScript](https://github.com/vitalets/github-trending-repos/issues/34)
* [Shell](https://github.com/vitalets/github-trending-repos/issues/35)
* [Swift](https://github.com/vitalets/github-trending-repos/issues/36)
* [Scala](https://github.com/vitalets/github-trending-repos/issues/37)
* [Objective-C](https://github.com/vitalets/github-trending-repos/issues/38)
* [Rust](https://github.com/vitalets/github-trending-repos/issues/44)
* [Haskell](https://github.com/vitalets/github-trending-repos/issues/46)
* [1C Enterprise](https://github.com/vitalets/github-trending-repos/issues/43)
* [R](https://github.com/vitalets/github-trending-repos/issues/39)
* [Pascal](https://github.com/vitalets/github-trending-repos/issues/41)

If you'd like to add new language - feel free to [open an issue](https://github.com/vitalets/github-trending-repos/issues/new).

## Alternatives
* Subscribe to official [GitHub Explore Newsletter](https://github.com/explore#newsletter)
* Subscribe to [Changelog Nightly](https://changelog.com/nightly) powered by [GitHub Archive](https://www.githubarchive.org/)
* Follow [@TrendingGithub](https://twitter.com/TrendingGithub) on Twitter
* View [gitmostwanted.com/trending](http://gitmostwanted.com/trending/)
* Browse contents of [josephyzhou/github-trending](https://github.com/josephyzhou/github-trending)

None of alternatives can *send notifications per programming language*. That's why I've created this project.

&copy; 2017 [Vitaliy Potapov](https://github.com/vitalets)

[trending-daily]: https://github.com/vitalets/github-trending-repos/labels/trending-daily
[trending-weekly]: https://github.com/vitalets/github-trending-repos/labels/trending-weekly
[GitHub notifications]: https://help.github.com/articles/accessing-your-notifications/
