const GrpcClient = require('../api/grpc-client');
const { REQUEST_TYPE } = require('../utilities/common-transformer.js')

const client = new GrpcClient("../protos/commandservice.proto", "localhost", "3000", "PortfolioService");

exports.applyRequests = async (lastResponse, request) => {
    var awaitedLastResponse = await lastResponse;
    switch(request.requestType) {
        case REQUEST_TYPE.CREATE_PORTFOLIO:
            var response =  await client.execute("CreatePortfolio", null);
            return response;
        case REQUEST_TYPE.ADD_ACCOUNT:
            var newRequest = {...request}
            newRequest["expectedRevision"] = awaitedLastResponse.nextExpectedRevision;
            newRequest["portfolioId"] = awaitedLastResponse.portfolioId;
            var response = await client.execute("AddAccount", newRequest);
            return response;
    }
}