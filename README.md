# A learning event log for EventSourcing and EventStore
## Motivation
At some point over the last two years I became fascinated with EventSourcing.  It started with a talk from Martin Fowler that I watched while doing research on Event Driven Architecture in preparation for a heavy transaction based project. [<sup>1</sup>](#footnotes) Based on this talk I 
 Additionally learning Domain Driven Design (DDD) EventSourcing, Command Query Responsibility Segregation (CQRS), Test Driven Development (TDD), Immutables and EventStore


## The Business Problem

## Learning event log

### Event processing should not throw exceptions #eventSourcing
3.26.2021 -  My first implementation of the portfolio-event-process threw exceptions for invalid states.  It became clear to me after this implementation that if a stream ever was serialized in a way that created an invalid state then there would be no way to recover the existing stream.  One of the key tenants to the event processor is that it should throw no exceptions.  It is not the job of the event processor to validate if events were serialized correctly. The challenge with throwing exceptions in the event processor is that there is no way to recover.  Events are immutable and you cannot inject an new event into the middle of the stream.  It is append only so corrections can only be made to the end of the stream of events.  That means validation has to occur prior to appending new events and exception notifications can be thrown in the UI after state is calculated to indicate a correction event needs to be appended.  For example: selling a security before it exists in the account should create a security with a negative quantity even though this is an invalid state.  It is the aggregate root object that should validate data consistency before serializing the event. 

### My attempt at loose coupling did no such thing #tdd #functionalProgramming
3.28.2021 - I am just now trying to implement snapshot functionality with the EventStore.  I am running into refactoring challenges because of the object layered implementation which I learned in my Object Oriented Design days.  I had been taught a long time ago that dependency injection with good interface design would allow loose coupling.  What I recognize now is that dependency injection only allows me to change the encapsulated implementation of the dependency but does not help at all when the interface needs to evolve due to the natural way that code refactoring and business requirements evolve during the initial implementation.  Dependency injection does allow me to swap out implementations once the interface is mature.  I waited until now to implement snapshot functionality which should be fine and acceptable because I focused first on the business logic.  I did not yet need to worry about the I/O utility of snapshots.  I think we all too often do not recognize that some of the terminology and goals we are trying to achieve is on a spectrum and not binary.  For example "Loose Coupling" seems easy to understand but it really needs a clearer definition.  What I want is to be able implement something as utility as snapshots without having to refactor all my objects nor my test cases.  If I find that I do have to do this even with dependency injection then I have not achieved "loose coupling" at all.  My research tells me this is the whole point of functional programming.  Building atomic-idempotent functions does not require interfaces.  What I am curious to discover, however, is whether piping of functions creates the same contractual dependencies as interfaces.  For example if I have two functions g(x) and h(x) and if I pipe the functions as g(h(x)) I have now made g(x) dependent on the output of h(x).  My guess is that I will need to try and avoid objects or structures being returned from my functions.  Perhaps just returning tuples will all lose coupling even further.  Based on all of the above I have decided that once I am done with this implementation I will refactor the entire project with the objective of having no mocks and trying to implement as declarative rather than imperative as possible.

### Exception are not very readable nor expressive #functionalProgramming #tdd
3.29.2021 - One thing I noticed when re-reading the code is that exception handling via the try catch throw pattern is not very expressive about possibilities or intention.  My personal pattern is to catch exceptions at the top of the call stack.  In this case I plan on catching all exceptions in the controller.  When building my test cases this becomes a little bit problematic for me in terms of expressiveness.  The controller is part of the I/O utility stack and therefore is not in the business logic stack.  My unit tests are focused to validate the business logic.  No where in the method signatures of my classes does it indicate where exceptions are thrown.  Even if it did it is not clear how each class in the call stack might be effected by a thrown exception.  A bit of research on this high-lighted the Either pattern (I like this blog post on it: https://www.thoughtworks.com/insights/blog/either-data-type-alternative-throwing-exceptions).  I had become aware of this pattern without realizing it while learning golang. I will attempt to use the Either pattern for error handling in my node.js refactor.

### Control mocking via config variable #tdd
3.29.2021 - Jest controls mocks by placing the mock object in the __mocks__ directory of the directory which the mock target exists.  In this case esdb.js is in the db directory so the structure looks like this:

> ./db/esdb.js<br>
> ./db/__mocks__/esdb.js

In my test case file I put the following code:
    jest.mock('../db/esdb')
This line tells Jest to use the mock implementation of esdb rather than the real implementation of esdb.  What I have been doing is commenting out the the jest.mock() line while developing so that my test cases execute against my real local implementation of EventStore. What I want to do is make this a switchable option so that I do not have to comment out all jest.mock lines when I want to switch from the mock implementation rather than the real implementation.  Unfortunately, but rightly so, Jest validates all cli inputs.  So it is not easy to use a command line switch.  Something like the following would be nice:

    npm test --unmockAll

I did see a blog post showing how to do this but it seemed like a lot of work to achieve when using an environment variable achieves the same goal and is a lot less work.  What I did instead was add the following the test.json file in my config directory.

        "testConfig" : {
        "unmockAll": false
    }

Then change the const ESDB = require() to var ESDB = require() and add the following lines after the jest.mock
    
    jest.mock('../db/esdb');
    if(config.hasOwnProperty("testConfig") && config.testConfig.hasOwnProperty("unmockAll") && config.testConfig.unmockAll) {
        ESDB = jest.requireActual('../db/esdb');
    }

Yes, getting this mock setup and working correctly has a lot of work and it feels unnecessary.  I'm quite convinced that I will be able to refactor this project to not have to use mocks for I/O utilities like EventStore or Grpc.  Those are well tested and well supported software packages so no need to include them in my unit tests.

### <a name="footnotes"></a>Footnotes:
1. GOTO 2017 • The Many Meanings of Event-Driven Architecture • Martin Fowler - https://www.youtube.com/watch?v=STKCRSUsyP0

### TODOs
* TODO:  Create a unit test without actually using ESDB to prove out whether it was important to mock it or not
* TODO:  Duplicate the project and implement a refactor to do it without mocks to compare
* TODO:  Make all mocks work and allow a command line argument to switch off mocks
* TODO:  Need to add to projections capital gains and short term gains minus fees and commissions
* TODO:  Do Commissions need to be a separate event from fees paid
* TODO:  Make sure to understand how to manage events so that no events are lost but also db size is managed
* TODO:  Make sure security number translations are accounted for (should be)