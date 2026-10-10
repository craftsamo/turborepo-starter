# Run AI Agent Workflow

**File**: `.github/workflows/opencode.yml`

## Prerequisites

- A comment on an issue or pull request that starts with `/oc` or `/opencode`
- The commenter is an owner, member, or collaborator of the repository
- Nothing else: the default models are free and need no secrets

## How It Works

The workflow runs the [OpenCode](https://opencode.ai) V2 CLI headlessly with
CI-only agents defined in `.github/opencode/`. The job copies that directory
into its own `XDG_CONFIG_HOME`, so the agents never appear in local OpenCode
sessions, while the repository's `AGENTS.md` and skills still apply.

### Process

1. **Trigger**: A comment starting with `/oc` or `/opencode` from a user with
   write access
2. **Checkout**: The default branch, without persisted credentials
3. **Prepare**: Parse the command, add a 👀 reaction, fetch the issue or pull
   request context, and fetch the pull request as `refs/opencode/head` (with
   its base as `refs/opencode/base`)
4. **Run**: Install the pinned `@opencode/cli` and run the agent, trying each
   model candidate in order
5. **Publish**: Post the answer as a comment, or post a pull request review
   with inline comments for `review`

The scripts live in `scripts/ci/opencode/`. Their parsing and decision logic
is covered by `nps test.scripts`; `main.mts`, which only wires `gh`, `git`,
and `opencode` together, is exercised by running the workflow.

### Commands

| Command                    | Description                                       | Issue | PR  |
| -------------------------- | ------------------------------------------------- | :---: | :-: |
| `/oc plan <instruction>`   | Investigate and propose a plan                    |  ✅   | ✅  |
| `/oc debug <instruction>`  | Diagnose a bug or failure and find the root cause |  ✅   | ✅  |
| `/oc review <instruction>` | Review the pull request with inline comments      |  ❌   | ✅  |
| `/oc <instruction>`        | Same as `plan`                                    |  ✅   | ✅  |
| `/oc`                      | `review` on a pull request, `plan` on an issue    |  ✅   | ✅  |

The instruction is optional for every agent and narrows what the agent looks
at. All agents are read-only: they cannot edit files, run builds or tests, or
call GitHub. `build` is reserved for a future write-enabled agent and is
rejected for now.

Commands also work in pull request review comments. There, `plan` and `debug`
reply in the thread and see the commented lines.

#### Usage Examples

```
/oc review
/oc review focus on error handling
/oc debug the login page returns 500 after the last deploy
/oc how should we split this issue into tasks?
```

## Models

Each run resolves a list of model candidates and uses the first one that
answers:

1. `OPENCODE_MODEL_<AGENT>` (`OPENCODE_MODEL_PLAN`, `_REVIEW`, `_DEBUG`)
2. `OPENCODE_MODEL`
3. The defaults in `.github/opencode/models.json`

Set the variables under **Settings > Secrets and variables > Variables**. A
value is one model ID or a comma-separated list in `provider/model` or
`provider/model#variant` form, for example `anthropic/claude-sonnet-5-5#high`
or `openai/gpt-5.5,opencode/space-bunny-free`. Variant names differ per model;
an unknown variant fails the run with an error instead of being ignored.

A candidate is skipped when OpenCode cannot reach it, for example a paid model
without a key. The defaults also skip a free model that refuses the request.
A configured model that fails for any other reason stops the run and reports
the error, so a broken setup is never hidden behind a different model.

### Default Models

`models.json` lists free [OpenCode Zen](https://opencode.ai/docs/zen/) models
whose providers neither retain nor train on prompts, in priority order:

| Model                               | Data policy (per the Zen docs) |
| ----------------------------------- | ------------------------------ |
| `opencode/space-bunny-free`         | No retention, no training      |
| `opencode/longcat-2.5-preview-free` | No retention, no training      |
| `opencode/step-5-preview-free`      | No retention, no training      |

Other free models such as `opencode/big-pickle` are left out because their
providers may use prompts to improve their models. Free models are offered for
a limited time, so review the list when a free model is retired or the Zen
data policies change, and update `checkedAt`. A model you set in a variable is
always used as configured, regardless of its data policy.

## Providers

Add a provider's API key as a repository secret to use its models. The run
step passes these secrets to OpenCode and nothing else:

| Secret               | Provider                              |
| -------------------- | ------------------------------------- |
| `OPENCODE_API_KEY`   | OpenCode Zen (paid models) and Go     |
| `OPENAI_API_KEY`     | OpenAI                                |
| `ANTHROPIC_API_KEY`  | Anthropic (a key from Claude Console) |
| `OPENROUTER_API_KEY` | OpenRouter                            |

Subscription logins are not supported:

- **GitHub Copilot**: OpenCode signs in through an interactive device login,
  and GitHub only sanctions Copilot in Actions for its own Copilot CLI.
- **ChatGPT Plus/Pro**: OpenAI directs automation to API keys, and the login
  token rotates, which ephemeral runners cannot keep.
- **Claude Pro/Max**: Anthropic does not permit third-party tools to use
  subscription credentials.

Cloud providers such as Amazon Bedrock or Google Vertex AI work by adding an
OIDC login step and their environment variables to the run step.

## Security

- **Read-only by rejection**: Every agent permission that is not explicitly
  allowed resolves to `ask`, which a non-interactive run rejects. Only reading
  files inside the repository and read-only git commands are allowed. Rules
  are `ask` rather than `deny` because the OpenCode free tier rejects requests
  whose core tools (edit, shell, and so on) were trimmed by deny rules. The
  workflow never passes `--auto`.
- **No network**: Code Mode (`execute`) can call `fetch` and is not stopped by
  `ask`, so it is denied, together with the desktop `browser` tools. Web fetch
  and web search resolve to `ask` and are rejected.
- **No reads outside the repository**: Given a path outside the working tree,
  `git diff` and `git blame --contents` read arbitrary files, including the
  process environment that holds the provider keys. `git diff` is therefore
  only allowed from `refs/opencode/*`, and git commands containing absolute,
  parent, or home paths, quotes, `$`, or file-writing and external-content
  flags (including git's abbreviations of them) are refused.
- **Trusted config**: The checkout is always the default branch, and pull
  request content is only read through git refs, so a pull request cannot
  change the agents or permissions used to review it.
- **Least privilege per step**: The GitHub token is only available to the
  prepare and publish steps. The run step has the provider keys but no GitHub
  token, and no credential is written to `.git/config`.
- **Output hygiene**: API key values are masked in anything posted back, and
  `@mentions` outside code blocks are broken so injected text cannot ping
  people or teams.

### Permissions

| Permission      | Level | Purpose                                 |
| --------------- | ----- | --------------------------------------- |
| `contents`      | read  | Check out the repository and fetch refs |
| `issues`        | write | Comment and react on issues             |
| `pull-requests` | write | Comment, react, and post reviews on PRs |

## Customizing

- **Agents**: Edit `.github/opencode/agents/<name>.md`. The Markdown body is
  the agent's system prompt and the frontmatter holds its permissions. Keep new
  rules as `allow` or `ask` (`deny` on core tools makes the free tier refuse
  the request; only `execute` and `browser` are denied), and keep the path
  rules after any
  new `allow` rule, because the last matching rule wins. Use only `*` as a
  wildcard in patterns: a backslash does not match literally, and `git *\*`
  matches every git command.
- **Default models**: Edit `.github/opencode/models.json`.
- **OpenCode version**: Change `OPENCODE_VERSION` in the workflow.

## Known Limitations

- Review comments on pull requests from forks get a read-only token from
  GitHub, so the workflow cannot reply there. Comment on the conversation tab
  instead.
- Members whose organization membership is private may not be recognized as
  members; make the membership public or add them as collaborators.
- A run stops after 15 minutes per model; the job stops after 30 minutes.
