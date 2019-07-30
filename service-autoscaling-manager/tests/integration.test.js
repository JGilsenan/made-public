import test from 'ava';
const sinon = require('sinon');
const app = require('../index');

const event = require('./events/state-change');
const eventNoAction = require('./events/no-action');
const eventTaskModified = require('./events/task-modified');

const describeTaskSdkResponse = require('./responses/task/describe-task');
const describeServiceSdkResponse = require('./responses/service/describe-service');
const describeServiceDrainingSdkResponse = require('./responses/service/describe-service-not-active');
const listBucketsSdkResponse = require('./responses/bucket/list-buckets');
const listObjectsSdkResponse = require('./responses/bucket/list-objects');
const getObjectSdkResponse = require('./responses/bucket/get-object');
const describeTaskDefinitionSdkResponse = require('./responses/task/describe-task-definition');
const describeScalableTargetSdkResponse = require('./responses/target/describe-scalable-targets');
const describeScalableTargetModifiedSdkResponse = require('./responses/target/describe-scalable-targets-modified');
const putPolicySdkResponse = require("./responses/policy/put-scaling-policy");
const createBucketSdkResponse = require("./responses/bucket/create-bucket");
const putObjectSdkResponse = require("./responses/bucket/put-object");
const describeAlarmSdkResp = require('./responses/alarm/describe-alarms');
const describePoliciesSdkResp = require('./responses/policy/describe-policy');
const listObjectsSdkResponseEmpty = require('./responses/bucket/list-objects-empty');
const describeScalableTargetSdkResponseNotFound = require('./responses/target/describe-scalable-targets-not-found');

const describeTaskSdkResponseNotFound = require('./responses/task/describe-task-not-found');
const describeServiceSdkResponseNotFound = require('./responses/service/describe-service-not-found');
const listBucketsSdkResponseEmpty = require('./responses/bucket/list-buckets-empty');
const describeAlarmSdkRespNotFound = require('./responses/alarm/describe-alarms-not-found');
const describePoliciesSdkRespNotFound = require('./responses/policy/describe-policy-not-found');

const serviceProfile = require('./etc/service-profile');
const serviceProfileNonScaling = require('./etc/service-profile-non-scaling');

const stubDescribeTask = sinon.stub();
const stubDescribeService = sinon.stub();
const stubListBuckets = sinon.stub();
const stubListObjects = sinon.stub();
const stubGetObject = sinon.stub();
const stubDescribeTaskDefinition = sinon.stub();
const stubDescribeScalableTarget = sinon.stub();
const stubPutScalingPolicy = sinon.stub();
const stubPutMetricAlarm = sinon.stub();
const stubCreateBucket = sinon.stub();
const stubWaitForBucketExists = sinon.stub();
const stubPutObject = sinon.stub();
const stubWaitForObjectExists = sinon.stub();
const stubGetAlarmDescription = sinon.stub();
const stubDeleteAlarm = sinon.stub();
const stubGetPolicyDescription = sinon.stub();
const stubDeletePolicy = sinon.stub();
const stubDeleteObject = sinon.stub();
const stubWaitForObjectNotExists = sinon.stub();
const stubDeleteBucket = sinon.stub();
const stubWaitForBucketNotExists = sinon.stub();

test.before(async t => {
  const setEnvironmentStub = sinon.stub(app, 'setEnvironment');
  app.deps = () => Promise.resolve({
    describeTasks: stubDescribeTask,
    describeServices: stubDescribeService,
    listBuckets: stubListBuckets,
    listObjects: stubListObjects,
    getObject: stubGetObject,
    describeTaskDefinition: stubDescribeTaskDefinition,
    describeScalableTargets: stubDescribeScalableTarget,
    putScalingPolicy: stubPutScalingPolicy,
    putMetricAlarm: stubPutMetricAlarm,
    createBucket: stubCreateBucket,
    waitForBucketExists: stubWaitForBucketExists,
    putObject: stubPutObject,
    waitForObjectExists: stubWaitForObjectExists,
    describeAlarms: stubGetAlarmDescription,
    deleteAlarms: stubDeleteAlarm,
    describeScalingPolicies: stubGetPolicyDescription,
    deleteScalingPolicy: stubDeletePolicy,
    deleteObject: stubDeleteObject,
    waitForObjectNotExists: stubWaitForObjectNotExists,
    deleteBucket: stubDeleteBucket,
    waitForBucketNotExists: stubWaitForBucketNotExists,
  });
});

test.beforeEach(async t => {
  stubDescribeTask.resolves(describeTaskSdkResponse);
  stubDescribeService.resolves(describeServiceSdkResponse);
  stubListBuckets.resolves(listBucketsSdkResponse);
  stubListObjects.resolves(listObjectsSdkResponse);
  getObjectSdkResponse.Body = new Buffer.from(JSON.stringify(serviceProfile));
  stubGetObject.resolves(getObjectSdkResponse);
  stubDescribeTaskDefinition.resolves(describeTaskDefinitionSdkResponse);
  stubDescribeScalableTarget.resolves(describeScalableTargetSdkResponse);
  stubPutScalingPolicy.resolves(putPolicySdkResponse);
  stubCreateBucket.resolves(createBucketSdkResponse);
  stubPutObject.resolves(putObjectSdkResponse);
  stubGetAlarmDescription.resolves(describeAlarmSdkResp);
  stubGetPolicyDescription.resolves(describePoliciesSdkResp);
  stubPutMetricAlarm.resolves({});
  stubWaitForBucketExists.resolves({});
  stubWaitForObjectExists.resolves({});
  stubDeleteAlarm.resolves({});
  stubDeletePolicy.resolves({});
  stubDeleteObject.resolves({});
  stubWaitForObjectNotExists.resolves({});
  stubDeleteBucket.resolves({});
  stubWaitForBucketNotExists.resolves({});
});

const copyObj = obj => JSON.parse(JSON.stringify(obj));


test.serial('No action required', async t => {
  app.debug = false;
  app.dependencies = await app.deps();
  await app.handler(event, {}, (err, data) => {
    if (err) {
      if (app.debug) console.log("Failure:");
      if (app.debug) console.log(err);
      t.fail();
    } else {
      if (app.debug) console.log("Success:");
      if (app.debug) console.log(data);
      t.pass();
    }
  });
});

test.serial('Updates: task', async t => {
  app.debug = false;
  app.dependencies = await app.deps();
  await app.handler(eventTaskModified, {}, (err, data) => {
    if (err) {
      if (app.debug) console.log("Failure:");
      if (app.debug) console.log(err);
      t.fail();
    } else {
      if (app.debug) console.log("Success:");
      if (app.debug) console.log(data);
      t.pass();
    }
  });
});

test.serial('Updates: target: target no longer exists', async t => {
  app.debug = false;
  stubDescribeScalableTarget.resolves(describeScalableTargetSdkResponseNotFound);
  app.dependencies = await app.deps();
  await app.handler(event, {}, (err, data) => {
    if (err) {
      if (app.debug) console.log("Failure:");
      if (app.debug) console.log(err);
      t.fail();
    } else {
      if (app.debug) console.log("Success:");
      if (app.debug) console.log(data);
      t.pass();
    }
  });
});

test.serial('Updates: target: target added to service', async t => {
  app.debug = false;
  let getObjectSdkResponseMod = copyObj(getObjectSdkResponse);
  getObjectSdkResponseMod.Body = new Buffer.from(JSON.stringify(serviceProfileNonScaling));
  stubGetObject.resolves(getObjectSdkResponseMod);
  app.dependencies = await app.deps();
  await app.handler(event, {}, (err, data) => {
    if (err) {
      if (app.debug) console.log("Failure:");
      if (app.debug) console.log(err);
      t.fail();
    } else {
      if (app.debug) console.log("Success:");
      if (app.debug) console.log(data);
      t.pass();
    }
  });
});

test.serial('Updates: target: target modified', async t => {
  app.debug = false;
  stubDescribeScalableTarget.resolves(describeScalableTargetModifiedSdkResponse);
  app.dependencies = await app.deps();
  await app.handler(event, {}, (err, data) => {
    if (err) {
      if (app.debug) console.log("Failure:");
      if (app.debug) console.log(err);
      t.fail();
    } else {
      if (app.debug) console.log("Success:");
      if (app.debug) console.log(data);
      t.pass();
    }
  });
});

test.serial('Deletes: no service profile: exits', async t => {
  app.debug = false;
  stubListObjects.resolves(listObjectsSdkResponseEmpty);
  stubDescribeService.resolves(describeServiceDrainingSdkResponse);
  app.dependencies = await app.deps();
  await app.handler(event, {}, (err, data) => {
    if (err) {
      if (app.debug) console.log("Failure:");
      if (app.debug) console.log(err);
      t.fail();
    } else {
      if (app.debug) console.log("Success:");
      if (app.debug) console.log(data);
      t.pass();
    }
  });
});

test.serial('Deletes: bucket too', async t => {
  app.debug = false;
  stubDescribeService.resolves(describeServiceDrainingSdkResponse);
  const objectCtStub = sinon.stub(app, 'getObjectsCountForBucket');
  objectCtStub.returns(0);
  app.dependencies = await app.deps();
  await app.handler(event, {}, (err, data) => {
    if (err) {
      if (app.debug) console.log("Failure:");
      if (app.debug) console.log(err);
      t.fail();
      objectCtStub.restore();
    } else {
      if (app.debug) console.log("Success:");
      if (app.debug) console.log(data);
      t.pass();
      objectCtStub.restore();
    }
  });
});

test.serial('Deletes: scalable', async t => {
  app.debug = false;
  stubDescribeService.resolves(describeServiceDrainingSdkResponse);
  app.dependencies = await app.deps();
  await app.handler(event, {}, (err, data) => {
    if (err) {
      if (app.debug) console.log("Failure:");
      if (app.debug) console.log(err);
      t.fail();
    } else {
      if (app.debug) console.log("Success:");
      if (app.debug) console.log(data);
      t.pass();
    }
  });
});

test.serial('Creates', async t => {
  app.debug = false;
  stubListObjects.resolves(listObjectsSdkResponseEmpty);
  app.dependencies = await app.deps();
  await app.handler(event, {}, (err, data) => {
    if (err) {
      if (app.debug) console.log("Failure:");
      if (app.debug) console.log(err);
      t.fail();
    } else {
      if (app.debug) console.log("Success:");
      if (app.debug) console.log(data);
      t.pass();
    }
  });
});