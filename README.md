# GitHub Trending Repos
[![CircleCI](https://circleci.com/gh/vitalets/github-trending-repos.svg?style=svg)](https://circleci.com/gh/vitalets/github-trending-repos)

This project allows you to stay notified about [new trending repositories](https://github.com/trending) in your favorite
programming language on GitHub.

## How it works
1. Every issue in this repo is related to particular programming language
2. You subscribe to issue updates by pressing <img alt="subscribe button" valign="middle" src="https://user-images.githubusercontent.com/1473072/32487280-46f4489c-c3ba-11e7-82d7-cfe073cac8d1.png"> button
3. Scheduled script runs on daily/weekly basis and crawls trending repos page
4. If there are new repos - the script drops a comment to corresponding issue
5. All issue subscribers receive [GitHub notification] in web interface <img alt="notification icon" valign="bottom" src="https://user-images.githubusercontent.com/1473072/32723023-01555c78-c87d-11e7-8190-6bf3bb0ec405.png"> or by email

## Schedule
* Daily check runs **every day at 00:00 UTC**
* Weekly check runs **every friday at 00:00 UTC**

## Examples
Notification in web interface:  
![Example of web notification](https://user-images.githubusercontent.com/1473072/32488601-4295b138-c3be-11e7-8eb2-18a624c54ca2.png)

The comment with new repos:  
![Example of comment](https://user-images.githubusercontent.com/1473072/32593861-c2030470-c53a-11e7-9272-30cae0632dd6.png)

## Available languages
Started from the [fifteen most popular languages on GitHub](https://octoverse.github.com/) and with the community help
there are following languages for subscription:
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

## How to add new language
If your favorite language is missing you are welcome to add it:

1. Please re-check that language is not in issues already
2. Create new issue by the following templates:  
   ```
   // Title
   New daily|weekly trending repos in %lang%

   // Body
   Subscribe to this issue and stay notified about new [daily|weekly trending repos in %lang%](https://github.com/trending/%lang%?since=daily|weekly)!
   ```

I will check it and mark with corresponding label. After that notifications will start working.  
Feel free to share the issue link with others to let community know about exiting projects!

## Alternatives
* Subscribe to [GitHub Explore Newsletter](https://github.com/explore#newsletter)
* Follow [@TrendingGithub](https://twitter.com/TrendingGithub) on Twitter
* Browse contents of [josephyzhou/github-trending](https://github.com/josephyzhou/github-trending)

Neither alternative can *filter notifications per programming language*. That's why I've created this project.

&copy; 2017 [Vitaliy Potapov](https://github.com/vitalets)

[trending-daily]: https://github.com/vitalets/github-trending-repos/labels/trending-daily
[trending-weekly]: https://github.com/vitalets/github-trending-repos/labels/trending-weekly
[GitHub notification]: https://help.github.com/articles/accessing-your-notifications/
