# Monorepo Backend Extraction Guide

This document outlines the exact, step-by-step process required to extract a system's backend microservices from a full-stack repository into an isolated, Docker-ready, CI/CD-compatible monorepo workspace.

Follow these 6 phases in your AI assistant to cleanly separate your backend architecture.

---

### Phase 1: Merging the Backend into the Monorepo
*Goal: Migrate the backend microservices from your team's full-stack repository directly into the unified `greenovate-be` monorepo.*

**Prompt for your AI:**
> "I have my backend microservices inside my full-stack repository in the `apps/` folder. I need to move them into our unified `greenovate-be` monorepo repository, which is located at **[INSERT ABSOLUTE PATH TO GREENOVATE-BE REPO HERE]**. 
> 
> Please write me a PowerShell script named `migrate-backend.ps1` that will:
> 1. Copy all of my backend microservice folders from my current `apps/` directory.
> 2. Paste them directly into the `apps/` directory of the `greenovate-be` monorepo.
> 3. Read my root `package.json` and append my suffixed backend `"scripts"` to the `greenovate-be` root `package.json`.
> 4. Read my `.env` file and append my specific prefixed backend variables to the `greenovate-be` root `.env` file.
> 5. Give me instructions on how to manually merge my Docker container definitions into the master `docker-compose.yml` so I don't accidentally overwrite the other teams' containers."

---

### Phase 2: Automating the Dependency Install
*Goal: Install `node_modules` for all the microservices at once without having to manually CD into every folder.*

**Prompt for your AI:**
> "I have extracted my backend microservices into a folder called `apps/`. There are multiple microservice folders inside it. Please write me a PowerShell script named `install-all.ps1` that will loop through every folder inside `apps/` and automatically run `npm install --no-audit --no-fund`. Ensure it prints the status to the console so I can track the progress."

---

### Phase 3: Creating Isolated `.env` Files for Local Running
*Goal: The microservices fail to run locally outside of Docker because they look for standard variables (like `DATABASE_URL`) but the root `.env` uses prefixed variables (like `OOS_AUTH_DATABASE_URL`). We need to extract them.*

**Prompt for your AI:**
> "I want to run my microservices locally on my Windows machine outside of Docker. I have a master `.env` file in the root of my project containing prefixed variables. 
> 
> Please write me a PowerShell script named `create-envs-mapped.ps1`. This script needs to:
> 1. Loop through all my microservices in the `apps/` folder.
> 2. Read the master root `.env` file.
> 3. Extract the specific variables that apply to that microservice, map them to standard variable names, and save them into a new `.env` file directly inside that specific microservice's folder.
> 
> *(Note: I will provide you with my master `.env` file and a list of my microservices so you know how to map them!)*"

---

### Phase 4: Distributing `.npmrc` for Docker Authentication
*Goal: Docker builds will crash with a 401 Unauthorized error because the individual microservice folders don't have the GitHub Package token to download the private `@implementsprint/sdk`.*

**Prompt for your AI:**
> "I am using a private GitHub npm package (`@implementsprint/sdk`). I have a `.npmrc` file in the root of my project containing the authentication token. 
> 
> Please write me a PowerShell script named `copy-npmrc.ps1` that will copy this root `.npmrc` file and paste it directly into every microservice folder inside my `apps/` directory. This is critical so my Dockerfiles can successfully run `npm install` inside the containers."

---

### Phase 5: Injecting the APICenter SDK Sandbox Configs
*Goal: Ensure all services have the dependencies and credentials to communicate with the shared API Gateway.*

**Prompt for your AI:**
> "I need to ensure all my microservices are configured to use our shared APICenter. 
> 
> Please write a PowerShell script that does two things:
> 1. Injects `"@implementsprint/sdk": "^1.1.2"` into the `dependencies` block of the `package.json` inside every microservice folder.
> 2. Appends the following 3 variables to the `.env` and `.env.example` file inside every microservice folder:
>    ```env
>    # APICenter Shared SDK Configuration
>    APICENTER_URL=https://api-center-test.itsandbox.site
>    APICENTER_TRIBE_ID=greenovate
>    APICENTER_TRIBE_SECRET=your_tribe_secret_here
>    ```"

---

### Phase 6: Standardizing Scripts for Docker & Local Startup
*Goal: Fix Docker build crashes caused by renamed scripts, and create a single click-to-run file for local development.*

**Prompt for your AI:**
> "I have two final tasks to make my backend run perfectly:
> 
> 1. **Docker Fix:** I renamed my scripts in `package.json` to have prefixes (e.g., `build:OOS-gateway`). But Docker is hardcoded to run `npm run build`. Please write a script to inject generic `"build": "nest build"` and `"start:prod": "node dist/main"` scripts back into the `package.json` of all my microservices.
> 
> 2. **Local Startup Batch File:** Please write me a Windows Batch file named `start-services.bat` that will launch every single one of my microservices simultaneously. It should open a new terminal window for each service, navigate to its folder, set its assigned `PORT=`, and run its specific `npm run start:dev:[PREFIX]` command."
