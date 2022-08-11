# AWS Lambda Function Proof of Concept with Node 16

## Includes ESLint, Typescript, Jest, and Layer support

This project contains source code and supporting files for a serverless application that you can deploy with the SAM CLI. It includes the following files and folders.

- `functions/src` - Code for the application's Lambda function.
- `functions/tests` - Unit tests for the application code.
- `events` - Invocation events that you can use to invoke the function.
- `template.yaml` - A template that defines the application's AWS resources, environment variables, layers, and other configurable settings.

## Build and Deploy the sample application

To prepare a build of the `app` module, run `npm run build`. This will compile all Typescript code into regular, deployable JavaScript code into `functions/dist`.

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.

- SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- Node.js - [Install Node.js 16](https://nodejs.org/en/), including the NPM package management tool.
- Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

To build and deploy your application for the first time, run the following in your shell:

```bash
sam build
sam deploy --guided
```

The first command will build the source of your application. The second command will package and deploy your application to AWS, with a series of prompts:

- **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
- **AWS Region**: The AWS region you want to deploy your app to.
- **Confirm changes before deploy**: If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
- **Allow SAM CLI IAM role creation**: Many AWS SAM templates, including this example, create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modifies IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
- **Save arguments to samconfig.toml**: If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to your application.

You can find your API Gateway Endpoint URL in the output values displayed after deployment.

## How to test locally

The AWS Toolkit extension (`amazonwebservices.aws-toolkit-vscode`) is highly recommended for the easiest credential management, S3 operations, debugging, and deployment features.

1. Once the Typescript code is ready to be tested, run `npm run build`.
2. Navigate to the `functions/dist` folder and open the compiled `app.js` containing the Lambda handler function.
3. If you're using VSCode, pressing F5 will launch a debug process using the provided `.vscode/launch.json` configuration, which must be within the root of your entire project where VSCode is open.

Expected `launch.json` structure:

```json
{
  "configurations": [
    {
      "type": "aws-sam",
      "request": "direct-invoke",
      "name": "HelloWorldFunction",
      "invokeTarget": {
        "target": "template",
        "templatePath": "${workspaceFolder}/lambda/template.yaml",
        "logicalId": "HelloWorldFunction"
      },
      "lambda": {
        "payload": {
          "json": {
            "folder": "TEST",
            "key": "cottage_fbx.fbx"
          }
        },
        "environmentVariables": {}
      }
    }
  ]
}
```

## Unit tests

Tests are defined in the `functions/tests` folder in this project. Use NPM to install and run unit tests

```bash
lambda-nodejs16.x$ npm install
lambda-nodejs16.x$ npm run test
```

## Resources

See the [AWS SAM developer guide](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/what-is-sam.html) for an introduction to SAM specification, the SAM CLI, and serverless application concepts.

Next, you can use AWS Serverless Application Repository to deploy ready to use Apps that go beyond hello world samples and learn how authors developed their applications: [AWS Serverless Application Repository main page](https://aws.amazon.com/serverless/serverlessrepo/)
