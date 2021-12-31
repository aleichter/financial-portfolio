# A learning event log for EventSourcing and EventStore
## Motivation
At some point in 2020 I became fascinated with EventSourcing.  It started with a talk from Martin Fowler that I watched while doing research on Event Driven Architecture in preparation for a heavy transaction based project. [<sup>1</sup>](#footnotes) This repo is to document my own journey that started with EventSourcing but expanded to multiple tangents that cover a wide variety of topics including:  EventSourcing, EventStore (https://www.eventstore.com/), Domain Driven Design (DDD), Event Storming, Command Query Responsibility Segregation (CQRS), Test Driven Development (TDD), Immutables, NodeJs, TypeScript, gRPC, Envoy, Keycloak, and more.

## Projects
financial-portfolio - parent project
|-> doc - supplemental documents used in this README file.  (e.g. drawio diagrams, etc.)
|-> envoy - yaml files for envoy configurations
|-> financial-portfolio-react-ui - the react ui
|-> jmeter - jmeter scripts used for load testing and validating load testing a gRPC endpoint
|-> portfolio-service-js - javascript service
|-> portfolio-service-ts - typescript service
|-> protos - storing the shared proto-buffers for use by gRCP clients and servers in child-projects


## The Business Problem

### Event Storm
![Event Storm](./doc/images/EventStorm.png)

### <a name="footnotes"></a>Footnotes:
1. GOTO 2017 • The Many Meanings of Event-Driven Architecture • Martin Fowler - https://www.youtube.com/watch?v=STKCRSUsyP0

### DEPLOYMENT READY TO INCLUDE ANALYTIC PROJECTIONS TODOs
* TODO:  Need to add to projections capital gains and short term gains minus fees and commissions
* TODO:  Make sure to understand how to manage events so that no events are lost but also db size is managed
* TODO:  Make sure security number translations are accounted for (should be)
* TODO:  Build Security Service for collecting daily unit price of securities
* TODO:  Consolidate all the links in the README to the footnotes

### REFACTOR TODOs
* TODO: REFACTOR THE WHOLE THING IN TYPESCRIPT YA DUMMY.  Without this I cannot really implement the Either pattern for exception expressiveness
* TODO:  Document EventStorming
* TODO:  Document Domain Ubiquitous Language
* TODO:  Complete C Level Architecture and put some language in the documentation related to C Level
* TODO:  Create a unit test without actually using ESDB to prove out whether it was important to mock it or not
* TODO:  Duplicate the project and implement a refactor to do it without mocks to compare
* TODO:  Do Commissions need to be a separate event from fees paid
* TODO:  Remove full path from json config so that the proto file is a relative path
* TODO:  Build a seperate example project to test uuidv4() function and whether it causes the open handle RANDOMBYTESREQUEST error in Jest by itself.  If it does enter a question or bug with uuidv4()
* TODO:  Confirm that license should be changed to the GNU license (copyleft)