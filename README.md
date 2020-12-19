<p align="center">
  <img width="200px" src="https://github.com/campion-breaker/campion/blob/main/public/images/campion-logo.png" alt="Campion" />
</p>

<p align="center">An edge-based circuit breaking middleware</p>

[![campion](https://img.shields.io/badge/campion-case%20study-orange)](https://campion-breaker.github.io/)
[![license](https://img.shields.io/badge/license-MIT-orange)](https://github.com/campion-breaker/campion/edit/main/README.md)
[![build](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com/campion-breaker/campion/edit/main/README.md)

## What Does it Do?
Campion is an edge-based serverless framework for implementing circuit-breaking functionality for synchronously called external services. It gives engineers the peace of mind that should their synchronously called services fail, a failure is returned immediately, thereby sheltering their system from cascading failures, giving their failed services time to recover, and providing their end user with a better experience.

<p>
  <img height="450px" src="https://github.com/campion-breaker/campion/blob/main/public/images/campion-setup.gif" alt="Campion" />
</p>

## Getting Started

### Prerequisites

- Either a Cloudflare or an AWS account
- npm installed

### Steps

1) Clone this repo
2) From the root, run `npm install -g` to install the dependencies

## Commands
Start every command with `campion <commandName>`, to use Campion with Cloudflare, and `campionaws <commandName>`, to use Campion with AWS. For example, `campion setup` or `campionaws stats`.

| Command | Action |
|---------|--------|
| `setup` | Sets up Campion and deploys all necessary code to the cloud provider of your choice |
| `add` | Adds a service to be protected by Campion |
| `update` | Updates any service you have with new configuration |
| `delete` | Deletes any service |
| `flip` | Flips the circuit state to any state of your choosing |
| `list` | Lists all of your currently protected services |
| `stats` | Launches a browser window at `localhost:7777` with your metrics and services configuration |
| `wipe` | Wipes Campion completely from your cloud provider. Within Cloudflare, the entire wiping happens in a matter of seconds. In AWS, however, it can take up to a few hours given that AWS requires that the circuit breaker code be completely removed from the Cloudfront distribution (this is how Campion is able to be distributed to the edge). If you have Campion deployed on AWS, you're able to run the `wipe` command as often as you'd like to check if Campion has finished wiping |

## Service Configuration

| Property | Definition |
|------------|-----------|
| `Service url` | The public url to the service that you're trying to call |
| `Service name` | The public url to the service that you're trying to call |
| `Max latency` | The amount of time in milliseconds that Campion should wait until the request is considered to have failed |
| `Timespan` | The timespan in milliseconds that Campion should consider when calculating the number of failed requests in order deem a service to be down and flip the circuit OPEN |
| `Network failures` | The number of network failures (within timespan) that will flip the circuit OPEN |
| `Service failures` | The number of service failures (within timespan) that will flip the circuit OPEN |
| `Error timeout` | The amount of time in milliseconds that Campion should wait before fliping the circuit from OPEN to HALF-OPEN |
| `Percent of requests` | The percent of requests that Campion should allow to hit the protected service when attempting to switch from HALF-OPEN to CLOSED |
| `Success threshold` | The number of successfull requests (within timespan) that will flip the circuit from HALF-OPEN to CLOSED |

## Metrics
Campion comes with a beautiful seamlessly integrated metrics UI. To see how your services are performing, what the traffic looks like, what the current services and their configurations look like, and when and how the state of your circuits changed, simply type `campion stats` for Cloudflare, or `campionaws stats` for AWS, from your CLI.

<img width="600px" src="https://github.com/campion-breaker/campion/blob/main/public/images/metrics-dashboard.png" alt="Campion" />

<img width="600px" src="https://github.com/campion-breaker/campion/blob/main/public/images/services-config.png" alt="Campion" />

<img width="600px" src="https://github.com/campion-breaker/campion/blob/main/public/images/campion-traffic.png" alt="Campion" />


## The Team
**[Gabriel De Almeida](https://gabrieldealmeida.com)** *Software Engineer* West Palm Beach, FL

**[Arthur Kauffman](https://arthurkauffman.dev)** *Software Engineer* New York, NY

**[Ben Zelinski](https://benzelinski.com)** *Software Engineer* Cleveland, OH