import test from 'ava';
const sinon = require('sinon');
const app = require('../index');

const data = require('./data/data-03-service-parsed');
const dataTargetProfiled = require('./data/data-07-target-profiled');
const dataWithPolicies = require('./data/data-08-with-policies');
const dataComplete = require('./data/data-04-with-retrieved-profile');

const putPolicySdkResp = require("./responses/policy/put-scaling-policy");
const createBucketSdkResp = require("./responses/bucket/create-bucket");
const putObjectSdkResp = require("./responses/bucket/put-object");

let createProfileStub;
let createScalingResourcesStub;
let uploadProfileStub;
let createPoliciesStub;
let createAlarmsStub;
let putPolicyStub;
let putMetricAlarmStub;
let setupFailureRollbackStub;
let doesBucketExistStub;
let createBucketStub;
let putObjectStub;

const copyObj = (obj) => JSON.parse(JSON.stringify(obj));

test.before(t => {
  const setEnvironmentStub = sinon.stub(app, 'setEnvironment');
  app.debug = false;
});

test.beforeEach(t => {
  createProfileStub = sinon.stub(app, 'createProfile');
  createProfileStub.returns(dataTargetProfiled);
  createScalingResourcesStub = sinon.stub(app, 'createScalingResources');
  uploadProfileStub = sinon.stub(app, 'uploadProfile');
  createPoliciesStub = sinon.stub(app, 'createPolicies');
  createAlarmsStub = sinon.stub(app, 'createAlarms');
  putPolicyStub = sinon.stub(app, 'putScalingPolicy');
  putMetricAlarmStub = sinon.stub(app, 'putMetricAlarm');
  setupFailureRollbackStub = sinon.stub(app, 'setupFailureRollback');
  doesBucketExistStub = sinon.stub(app, 'doesBucketExist');
  createBucketStub = sinon.stub(app, 'createBucket');
  putObjectStub = sinon.stub(app, 'putObject');
});

test.afterEach(t => {
  createProfileStub.restore();
  createScalingResourcesStub.restore();
  uploadProfileStub.restore();
  createPoliciesStub.restore();
  createAlarmsStub.restore();
  putPolicyStub.restore();
  putMetricAlarmStub.restore();
  setupFailureRollbackStub.restore();
  doesBucketExistStub.restore();
  createBucketStub.restore();
  putObjectStub.restore();
});

test.serial('createService creates service profile, creates scaling resources, and uploads profile', async t => {
  await app.createService(copyObj(data));
  t.true(createProfileStub.called);
  t.true(createScalingResourcesStub.called);
  t.true(uploadProfileStub.called);
});

test.serial('createScalingResources returns if the service is not scalable', async t => {
  createScalingResourcesStub.restore();
  const dataMod = copyObj(dataTargetProfiled);
  dataMod.serviceProfile.Scalable = false;
  t.deepEqual(await app.createScalingResources(dataMod), dataMod);
});

test.serial('createScalingResources creates the scaling policies and alarms', async t => {
  createScalingResourcesStub.restore();
  await app.createScalingResources(copyObj(dataTargetProfiled));
  t.true(createPoliciesStub.called);
  t.true(createAlarmsStub.called);
});

test.serial('createPolicies puts the two scaling policies', async t => {
  createPoliciesStub.restore();
  await app.createPolicies(copyObj(dataTargetProfiled));
  t.true(putPolicyStub.calledTwice);
});

test.serial('createPolicies profiles the two scaling policies', async t => {
  createPoliciesStub.restore();
  putPolicyStub.returns(putPolicySdkResp.PolicyARN);
  t.deepEqual(await app.createPolicies(copyObj(dataTargetProfiled)), dataWithPolicies);
});

test.serial("putScalingPolicy puts new scaling policy using aws sdk", async t => {
  putPolicyStub.restore();
  const mockPutPolicy = sinon.mock();
  mockPutPolicy.resolves(putPolicySdkResp);
  app.deps = () => Promise.resolve({ putScalingPolicy: mockPutPolicy });
  app.dependencies = await app.deps();
  t.is(await app.putScalingPolicy('abc', 'def', 'ghi'), putPolicySdkResp.PolicyARN);
});

test.serial('createPolicies returns data with caught errors', async t => {
  createPoliciesStub.restore();
  putPolicyStub.throws(new Error('Test Error'))
  try {
    await app.createPolicies(copyObj(dataTargetProfiled));
  } catch (err) {
    t.deepEqual(err.data, dataTargetProfiled);
  }
});

test.serial('createAlarms puts the two metric alarms', async t => {
  createAlarmsStub.restore();
  await app.createAlarms(copyObj(dataWithPolicies));
  t.true(putMetricAlarmStub.calledTwice);
});

test.serial('createAlarms profiles the two scaling alarms', async t => {
  createAlarmsStub.restore();
  t.deepEqual(await app.createAlarms(copyObj(dataWithPolicies)), dataComplete);
});

test.serial('createAlarms returns data with caught errors', async t => {
  createAlarmsStub.restore();
  putMetricAlarmStub.throws(new Error('Test Error'))
  const dataMod = copyObj(dataWithPolicies);
  dataMod.serviceProfile.ScalingConfig.MetricName = dataComplete.serviceProfile.ScalingConfig.MetricName;
  try {
    await app.createAlarms(copyObj(dataWithPolicies));
  } catch (err) {
    t.deepEqual(err.data, dataMod);
  }
});

test.serial('createService rolls back on failure', async t => {
  createProfileStub.throws(new Error('test'));
  await app.createService(copyObj(data));
  t.true(setupFailureRollbackStub.called);
});

test.serial('uploadProfile creates cluster bucket if it does not exist', async t => {
  uploadProfileStub.restore();
  doesBucketExistStub.returns(false);
  await app.uploadProfile(copyObj(dataComplete));
  t.true(doesBucketExistStub.called);
  t.true(createBucketStub.called);
});

test.serial('uploadProfile does not create cluster bucket if it does exist', async t => {
  uploadProfileStub.restore();
  doesBucketExistStub.returns(true);
  await app.uploadProfile(copyObj(dataComplete));
  t.true(doesBucketExistStub.called);
  t.false(createBucketStub.called);
});

test.serial("createBucket creates new s3 bucket using aws sdk", async t => {
  createBucketStub.restore();
  const mockCreateBucket = sinon.mock();
  const mockWaitForBucket = sinon.mock();
  mockCreateBucket.resolves(createBucketSdkResp);
  mockWaitForBucket.resolves({});
  app.deps = () => Promise.resolve({
    createBucket: mockCreateBucket,
    waitForBucketExists: mockWaitForBucket
  });
  app.dependencies = await app.deps();
  t.is(await app.createBucket('abc'), createBucketSdkResp.Location);
});

test.serial('uploadProfile puts the new service profile in the bucket', async t => {
  uploadProfileStub.restore();
  doesBucketExistStub.returns(true);
  await app.uploadProfile(copyObj(dataComplete));
  t.true(putObjectStub.called);
});

test.serial("putObject uploads the service profile using aws sdk", async t => {
  putObjectStub.restore();
  const mockPutObject = sinon.mock();
  const mockWaitForObject = sinon.mock();
  mockPutObject.resolves(putObjectSdkResp);
  mockWaitForObject.resolves({});
  app.deps = () => Promise.resolve({
    putObject: mockPutObject,
    waitForObjectExists: mockWaitForObject
  });
  app.dependencies = await app.deps();
  t.is(await app.putObject('abc', 'def', 'ghi'), putObjectSdkResp.ETag);
});