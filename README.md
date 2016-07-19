# Meteor Up Git Autodeploy

meteor-up-git-autodeploy (`muga`) is a command line tool to automate your meteor application deployment using [Meteor Up](https://github.com/arunoda/meteor-up) when a git webhook has been triggered (or any other service that can issue a POST http request).

## Requirements

### Meteor Up

Because we are using **Meteor Up** to deploy the application, we assume that you already installed it globally on your system and that you already setup your server environment by running `mup setup`.

Please note that you **MUST** place a [mup.json](https://github.com/arunoda/meteor-up/blob/master/example/mup.json) file in the directory where you will run `muga`.

You can find more information about Meteor Up configuration in their [documentation](https://github.com/arunoda/meteor-up).

### Git

You will need to have a git version superior to 1.8.5 to use `muga`. Also, we suppose you already added your server user SSH key to your git user account, in order to access to the repository without involving passwords.

You can find more information on how to do this on most git repository hosting services documentation: [GitHub](https://help.github.com/articles/generating-an-ssh-key/), [Bitbucket](https://confluence.atlassian.com/bitbucket/set-up-ssh-for-git-728138079.html) & [GitLab](http://doc.gitlab.com/ce/ssh/README.html).

## Installation

You can install it globally using npm:

    npm install -g meteor-up-git-autodeploy

## Usage

By default, only your git repository url is required to use `muga`:

`muga git@github.com:schankam/meteor-up-git-autodeploy.git`

You can now trigger the deployment of you app (as it is defined in your `mup.json`) by sending a POST request to your server:

`curl -X POST http://<your-server-ip>/deploy`

## Available options

To see a list of all available options, just run `muga` without any argument or by typing `muga --help`.

### Port number

By default, `muga` is listening on the port 80. You can change this behavior by using the `-p <port>` option.

### Git branch

By default, `muga` assumes the master branch is what you want to deploy. You can specify the branch to deploy by using the `-b <branch>` option. Note that the branch is automatically prefixed with `origin/`, such that providing `-b dev` will checkout `origin/dev`.

### Verbose

`muga` is a quiet tool, but if you want it to talk more, just use the `-v` option and it will output all the log on the standard output.

### Token

By default, you service is accessible by anyone and you might want to restrict it a little bit more; you can do this by specifiying a request token: `-t <your-token>`.

You will then need to pass this token in the query string of your request:

`curl -X POST http://<your-server-ip>/deploy?token=<your-token>`

### Slack integration

If you wish to have the log of your deployment in a specific [Slack](http://slack.com) channel, you can do it by specifying a [Slack incoming webhook](https://api.slack.com/incoming-webhooks) with the `-s <your-slack-hook-url>` option.

## Integration with GitHub, Bitbucket, or GitLab

You can now setup any git repository to call your deployment url on a specific event by managing webhooks on the different git repository hosting providers: [GitHub](https://developer.github.com/webhooks/), [Bitbucket](https://confluence.atlassian.com/bitbucket/manage-webhooks-735643732.html) & [GitLab](https://gitlab.com/gitlab-org/gitlab-ce/blob/master/doc/web_hooks/web_hooks.md).
