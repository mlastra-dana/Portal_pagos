import { defineFunction } from '@aws-amplify/backend';
import { Duration, Stack } from 'aws-cdk-lib';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const functionDir = dirname(fileURLToPath(import.meta.url));

const BEDROCK_REGION = process.env.AMPLIFY_BEDROCK_REGION ?? 'us-east-1';
const BEDROCK_MODEL_ID = process.env.AMPLIFY_BEDROCK_MODEL_ID ?? 'anthropic.claude-sonnet-4-20250514-v1:0';
const RESULT_BUCKET = process.env.AMPLIFY_RESULT_BUCKET ?? '';
const RESULT_PREFIX = process.env.AMPLIFY_RESULT_PREFIX ?? 'receipt-validations';

export const Validarcomprobante = defineFunction((scope: Construct) => {
  const lambda = new LambdaFunction(scope, 'ValidarcomprobanteLambda', {
    functionName: 'validar-comprobante',
    runtime: Runtime.PYTHON_3_12,
    handler: 'handler.lambda_handler',
    code: Code.fromAsset(functionDir),
    timeout: Duration.seconds(60),
    memorySize: 1024,
    environment: {
      BEDROCK_REGION,
      BEDROCK_MODEL_ID,
      RESULT_BUCKET,
      RESULT_PREFIX,
    },
  });

  const stack = Stack.of(lambda);
  const modelArn = `arn:${stack.partition}:bedrock:${BEDROCK_REGION}::foundation-model/${BEDROCK_MODEL_ID}`;

  lambda.addToRolePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['bedrock:InvokeModel', 'bedrock:InvokeModelWithResponseStream'],
      resources: [modelArn],
    }),
  );

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
