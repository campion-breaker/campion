const prompt = require('prompts');
const loadingBar = require('../../cloudflare/utils/loadingBar');
const fs = require('fs');
const deleteTable = require('../api/dynamoDB/deleteTable');
const deleteFunction = require('../api/lambda/deleteFunction');
const deleteDistribution = require('../api/cloudFront/deleteDistribution');
const deleteRole = require('../api/iam/deleteRole');
const deleteRolePolicy = require('../api/iam/deleteRolePolicy');
const configDir = require('../utils/configDir');
require('dotenv').config({ path: `${configDir}/.env` });

const wipeSuccessMsg = () => {
  console.log(
    `\nAll AWS information successfully deleted. Run 'campionaws setup' to redeploy.`
  );
};

const confirm = () => {
  return {
    type: 'confirm',
    name: 'value',
    message: `Confirm deletion of Campion from AWS.\n  This will erase all Circuit Breakers, settings, and protected endpoints.\n  This action cannot be undone.\n  Are you sure?`,
    initial: false,
  };
};

const deleteAllExistingTables = async () => {
  const servicesConfig = process.env.AWS_SERVICES_CONFIG;
  const events = process.env.AWS_EVENTS;
  const requestLog = process.env.AWS_REQUEST_LOG;
  const traffic = process.env.AWS_TRAFFIC;

  if (servicesConfig) {
    const data = await deleteTable('SERVICES_CONFIG');
    const status = data.TableDescription.TableStatus;
    if (status !== 'DELETING') {
      throw 'Something went wrong. Please try again.';
    }
    console.log('DYNAMODB', data);
  }

  // const tableDeletion1 = await deleteTable('SEVICES_CONFIG');
  // const tableDeletion2 = await deleteTable('EVENTS');
  // const tableDeletion3 = await deleteTable('REQUEST_LOG');
  // const tableDeletion4 = await deleteTable('TRAFFIC');
};

const deleteExistingRole = async () => {
  const roleName = process.env.AWS_ROLE_NAME;

  if (roleName) {
    await deleteRolePolicy('AWSLambdaFullAccess');
    await deleteRolePolicy('AmazonDynamoDBFullAccess');
    await deleteRolePolicy('CloudFrontFullAccess');
    const data = await deleteRole(roleName);
    console.log('ROLE', data);
  }
};

const deleteExistingDistribution = async () => {
  const distributionId = process.env.AWS_CLOUDFRONT_ID;
  let data;

  if (distributionId) {
    data = await deleteDistribution(distributionId);
    console.log('CLOUDFRONT', data);
  }
};

const deleteExistingFunction = async () => {
  const lambdaArn = process.env.AWS_LAMBDA_ARN;

  if (lambdaArn) {
    const data = await deleteFunction();
    console.log('LAMBDA', data);
  }
};

const wipe = async () => {
  const confirmation = await prompt(confirm());

  if (!confirmation.value) {
    console.log('Campion deletion aborted.');
    return;
  }

  const deleteServiceId = loadingBar(`\nDeleting Campion `);

  try {
    await deleteAllExistingTables();
    await deleteExistingRole();
    await deleteExistingDistribution();
    await deleteExistingFunction();
    clearInterval(deleteServiceId);
    wipeSuccessMsg();
  } catch (e) {
    clearInterval(deleteServiceId);
    console.log(e.message);
  } finally {
  }
};

module.exports = wipe;
