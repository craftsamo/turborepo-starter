# Run AI Agent Workflow

**File**: `.github/workflows/opencode.yml`, which calls
[repo-kit's `opencode` workflow](https://github.com/craftsamo/repo-kit#oc-agents)
pinned to `v1`

## Prerequisites

- A comment on an issue or pull request that starts with `/oc` or `/opencode`
- The commenter is an owner, member, or collaborator of the repository
- For `/oc build` on issues: Actions may create pull requests (set by
  `nps setup.github`)
- Nothing else: the default models are free and need no secrets

## How It Works

repo-kit runs the [OpenCode](https://opencode.ai) CLI with its own CI agents,
which never appear in local sessions, while this repository's `AGENTS.md` and
`.opencode/skills/` still apply. A job without write access first reads which
agent the comment asks for; only `build` runs with write access to contents,
and the GitHub token never reaches the agent itself. repo-kit's README covers
the agents, their permissions and the security model.

### Commands

| Command                    | Description                                       | Issue | PR  |
| -------------------------- | ------------------------------------------------- | :---: | :-: |
| `/oc plan <instruction>`   | Investigate and propose a plan                    |  ✅   | ✅  |
| `/oc build <instruction>`  | Make the change and commit it                     |  ✅   | ✅  |
| `/oc debug <instruction>`  | Diagnose a bug or failure and find the root cause |  ✅   | ✅  |
| `/oc review <instruction>` | Review the pull request with inline comments      |  ❌   | ✅  |
| `/oc <instruction>`        | Same as `plan`                                    |  ✅   | ✅  |
| `/oc`                      | `review` on a pull request, `plan` on an issue    |  ✅   | ✅  |

The instruction is optional for every agent and narrows what the agent looks
at. `plan`, `review`, and `debug` are read-only: they cannot edit files, run
builds or tests, or call GitHub.

A command is about where it is written, so a short instruction is enough:

- **Review comments**: on a line or as a reply in a review thread. The agent
  gets the commented lines and the earlier comments of the thread, and `plan`,
  `build`, and `debug` reply in the thread.
- **Quote replies**: quote a comment and put the command after the quote. The
  quoted text becomes the subject of the request.

```
/oc review
/oc review focus on error handling
/oc build add unit tests for parseMaxChangedLines
/oc debug the login page returns 500 after the last deploy
/oc how should we split this issue into tasks?
```

### Build

`build` edits files and the workflow commits them: on an issue it pushes a new
branch and opens a pull request that closes the issue; on a pull request it
commits to the pull request's branch. Pull requests from forks are refused,
and so are changes to `.github/workflows/`, which `GITHUB_TOKEN` cannot push.

The agent cannot run builds, linters or tests. The workflow starts the Tests
workflow on the pushed branch instead, as the `ci-workflow` input of
`opencode.yml` names. That run is not attached to the pull request, so it does
not count toward the `Required checks` status that protects `main`. To get a
regular pull request run, approve the waiting workflow run of a new pull
request, or close and reopen an existing one; the build's reply says which.

## Models

Each run tries model candidates in order and uses the first one that answers:

1. `OPENCODE_MODEL_<AGENT>` (`OPENCODE_MODEL_PLAN`, `_BUILD`, `_REVIEW`,
   `_DEBUG`)
2. `OPENCODE_MODEL`
3. repo-kit's free defaults, whose providers neither retain nor train on
   prompts

Set the variables with `nps setup.github`, which checks the format, or under
**Settings > Secrets and variables > Variables**. A value is one model ID or a
comma-separated list in `provider/model` or `provider/model#variant` form, for
example `anthropic/claude-sonnet-5-5#high`.

## Providers

Add a provider's API key as a repository secret to use its models, with
`nps setup.github.secrets` or in the repository settings. `opencode.yml`
passes these by name:

| Secret               | Provider                              |
| -------------------- | ------------------------------------- |
| `OPENCODE_API_KEY`   | OpenCode Zen (paid models) and Go     |
| `OPENAI_API_KEY`     | OpenAI                                |
| `ANTHROPIC_API_KEY`  | Anthropic (a key from Claude Console) |
| `OPENROUTER_API_KEY` | OpenRouter                            |

Subscription logins (GitHub Copilot, ChatGPT Plus/Pro, Claude Pro/Max) are not
supported.

## Skills and Plugins

The agents load the skills in `.opencode/skills/`. A skill only adds
instructions; a command it suggests still goes through the agent's rules, so
steps such as running tests are rejected and the agent works without them.

Plugins in `.opencode/plugins/` load in CI too, with the provider keys and
network access, and their tools are not checked against the agents'
permissions; for `build` on a pull request, the branch's own plugins load.
Review plugin changes as carefully as workflow changes.

Do not define an agent with a CI agent's name (`plan`, `build`, `review`,
`debug`, or a `ci-` subagent) in `.opencode/agents/` or `opencode.jsonc`: the
run stops, since it would override the CI agent's permissions.

## Known Limitations

- Review comments on pull requests from forks get a read-only token from
  GitHub, so the workflow cannot reply there. Comment on the conversation tab
  instead.
- Commands in review comments do not run while the pull request has merge
  conflicts. Resolve them first, or comment on the conversation tab, quoting
  the review comment to keep it as the subject.
- Members whose organization membership is private may not be recognized as
  members; make the membership public or add them as collaborators.
- A `build` commit is not checked before it is pushed; the Tests workflow
  reports on it afterwards.
- A run stops after 15 minutes per model; the job stops after 30 minutes.
