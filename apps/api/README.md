# API Application

## Overview

The `apps/api` is the backend service for the Turborepo Starter project.

It is built using the NestJS framework, providing robust and scalable APIs for the application ecosystem.

## Development

1. Install dependencies

```sh
nps prepare.api
```

2. Start the application

```sh
nps dev
```

OR

```sh
nps docker.build.api && nps start.api
```

3. Access [localhost](http://localhost/api) in your browser

## Deployment

The API application is designed to run in a containerized environment. During deployment, it listens on port 5002 and can be reverse-proxied using tools like NGINX.

## Reverse Proxy

The API is reverse-proxied by an NGINX server. The proxy server routes requests based on the path:

- `/api/` is forwarded to the API backend running on `http://host.docker.internal:5002/`.
- Other routes, including `/` and `/_next/webpack-hmr`, are forwarded to the Next.js frontend running on `http://host.docker.internal:3000/`.

This configuration ensures seamless integration between the frontend and backend services.
