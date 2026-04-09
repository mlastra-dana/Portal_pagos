import { defineFunction } from '@aws-amplify/backend';
import { Duration, Stack } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const functionDir = dirname(fileURLToPath(import.meta.url));

const BEDROCK_REGION = process.env.AMPLIFY_BEDROCK_REGION ?? 'us-east-1';
const BEDROCK_MODEL_ID = process.env.AMPLIFY_BEDROCK_MODEL_ID ?? 'us.anthropic.claude-3-7-sonnet-20250219-v1:0';
const RESULT_BUCKET = process.env.AMPLIFY_RESULT_BUCKET ?? '';
const RESULT_PREFIX = process.env.AMPLIFY_RESULT_PREFIX ?? 'receipt-validations';

const isInferenceProfile = /^(us|eu|apac|global|us-gov)\./.test(BEDROCK_MODEL_ID);
const baseModelId = isInferenceProfile ? BEDROCK_MODEL_ID.replace(/^[^.]+\./, '') : BEDROCK_MODEL_ID;

export const Validarcomprobante = defineFunction((scope: Construct) => {
  const lambda = new LambdaFunction(scope, 'ValidarcomprobanteLambda', {
    functionName: 'validar-comprobante',
    runtime: Runtime.PYTHON_3_12,
    handler: 'handler.lambda_handler',
    code: Code.fromAsset(functionDir),
    timeout: Duration.seconds(180),
    memorySize: 2048,
    environment: {
      BEDROCK_REGION,
      BEDROCK_MODEL_ID,
      RESULT_BUCKET,
      RESULT_PREFIX,
    },
  });

  const stack = Stack.of(lambda);
  const invokeActions = ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'];

  if (isInferenceProfile) {
    const inferenceProfileArn =
      `arn:${stack.partition}:bedrock:${BEDROCK_REGION}:${stack.account}:inference-profile/${BEDROCK_MODEL_ID}`;
    const destinationRegions = ['us-east-1', 'us-east-2', 'us-west-2'];
    const foundationModelArns = destinationRegions.map(
      (region) => `arn:${stack.partition}:bedrock:${region}::foundation-model/${baseModelId}`,
    );

    lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: invokeActions,
        resources: [inferenceProfileArn],
      }),
    );

    lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: invokeActions,
        resources: foundationModelArns,
        conditions: {
          StringEquals: {
            'bedrock:InferenceProfileArn': inferenceProfileArn,
          },
        },
      }),
    );
  } else {
    const modelArn = `arn:${stack.partition}:bedrock:${BEDROCK_REGION}::foundation-model/${BEDROCK_MODEL_ID}`;

    lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: invokeActions,
        resources: [modelArn],
      }),
    );
  }

  if (RESULT_BUCKET) {
    lambda.addToRolePolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ['s3:PutObject'],
        resources: [`arn:${stack.partition}:s3:::${RESULT_BUCKET}/${RESULT_PREFIX}/*`],
      }),
    );
  }

  return lambda;
});
