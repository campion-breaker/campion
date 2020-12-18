<p align="center">
  <img src="https://github.com/campion-breaker/campion/blob/main/public/images/campion-logo.png" alt="Campion" />
</p>

<p align="center">An edge-based circuit breaking middleware</p>

## What Does it Do?
Campion is an edge-based serverless framework for implementing circuit-breaking functionality for synchronously called external services. It gives engineers the peace of mind should their synchronously called services fail, that a failure is returned immediately, thereby sheltering your application from cascading failures, giving your failed services time to recover, and give your end user a better experience.

<p>
  <img height="450px" src="https://github.com/campion-breaker/campion/blob/main/public/images/campion-setup.gif" alt="Campion" />
</p>

## Getting Started

### Prerequesites

- Either a CloudFlare or an AWS account
- npm installed

### Steps

1) Clone this repo
2) From the root, run `npm install -g` to install the dependencies

### Commands
Start every command with `campion`, to use Campion with Cloudflare, and `campionaws`, to use Campion with AWS. For example, `campion setup` or `campionaws stats`.
- `setup`
  - sets up Campion and deploys all necessary code to the cloud provider of your choice
- `add`
  - adds a service to be protected by Campion
- `update`
  - updates any service you have with new configuration
- `delete`
  - deletes any service
- `flip`
  - flips the circuit state to any state of your choosing
- `list`
  - lists all of your currently protected services
- `stats`
  - launches a browser window at `localhost:7777` with your metrics and service configuration
- `wipe`
  - wipes Campion completely from the cloud provider. Within Cloudflare, the entire wiping happens in a matter of seconds. In AWS, however, it can take up to 9 hours given that AWS requires that the circuit breaker code be completely removed from the Cloudfront distribution (this is how Campion is able to be distributed to the edge). If you have Campion deployed on AWS, you're able to run the `wipe` command as often as you'd like to check if Campion has finished wiping
