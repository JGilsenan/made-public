import test from 'ava';
const sinon = require('sinon');
const app = require('../index');

const dataNoProf = require('./data/data-03-service-parsed');
const data = require('./data/data-04-with-retrieved-profile');

const describeAlarmSdkResp = require('./responses/alarm/describe-alarms');
const describeAlarmSdkRespNotFound = require('./responses/alarm/describe-alarms-not-found');
const describePoliciesSdkResp = require('./responses/policy/describe-policy');
const describePoliciesSdkRespNotFound = require('./responses/policy/describe-policy-not-found');

const alarmDescription = require('./desc/alarm-description');
const policyDescription = require('./desc/policy');

let deleteAlarmsStub;
let deletePoliciesStub;
let deleteProfileStub;
let doesAlarmExistStub;
let getAlarmDescriptionStub;
let deleteAlarmStub;
let doesPolicyExistStub;
let getPolicyDescriptionStub;
let deleteScalingPolicyStub;
let deleteS3ObjectStub;
let getObjectsCountForBucketStub;
let deleteS3BucketStub;

const copyObj = (obj) => JSON.parse(JSON.stringify(obj));

test.before(t => {
  const setEnvironmentStub = sinon.stub(app, 'setEnvironment');
  app.debug = false;
});

test.beforeEach(t => {
  deleteAlarmsStub = sinon.stub(app, 'deleteServiceAlarms');
  deletePoliciesStub = sinon.stub(app, 'deletePolicies');
  deleteProfileStub = sinon.stub(app, 'deleteProfile');
  doesAlarmExistStub = sinon.stub(app, 'doesAlarmExist');
  getAlarmDescriptionStub = sinon.stub(app, 'describeAlarms');
  deleteAlarmStub = sinon.stub(app, 'deleteAlarms');
  doesPolicyExistStub = sinon.stub(app, 'doesPolicyExist');
  getPolicyDescriptionStub = sinon.stub(app, 'describeScalingPolicies');
  deleteScalingPolicyStub = sinon.stub(app, 'deleteScalingPolicy');
  deleteS3ObjectStub = sinon.stub(app, 'deleteObject');
  getObjectsCountForBucketStub = sinon.stub(app, 'getObjectsCountForBucket');
  deleteS3BucketStub = sinon.stub(app, 'deleteBucket');
});

test.afterEach(t => {
  deleteAlarmsStub.restore();
  deletePoliciesStub.restore();
  deleteProfileStub.restore();
  doesAlarmExistStub.restore();
  getAlarmDescriptionStub.restore();
  deleteAlarmStub.restore();
  doesPolicyExistStub.restore();
  getPolicyDescriptionStub.restore();
  deleteScalingPolicyStub.restore();
  deleteS3ObjectStub.restore();
  getObjectsCountForBucketStub.restore();
  deleteS3BucketStub.restore();
});


test.serial('deleteService returns if service profile does not exist', async t => {
  t.is(await app.deleteService(copyObj(dataNoProf)), "Service profile DNE, no action taken");
});

test.serial('deleteService deletes service alarms/policies if service is scalable', async t => {
  await app.deleteService(copyObj(data));
  t.true(deleteAlarmsStub.called);
  t.true(deletePoliciesStub.called);
});

test.serial('deleteService does not delete service alarms/policies if service is not scalable', async t => {
  const dataMod = copyObj(data);
  dataMod.serviceProfile.Scalable = false;
  await app.deleteService(dataMod);
  t.false(deleteAlarmsStub.called);
  t.false(deletePoliciesStub.called);
});

test.serial('deleteService deletes service profile', async t => {
  const dataMod = copyObj(data);
  dataMod.serviceProfile.Scalable = false;
  await app.deleteService(dataMod);
  t.true(deleteProfileStub.called);
});

test.serial('deleteServiceAlarms returns 0 if service profile is missing scaling configuration', async t => {
  deleteAlarmsStub.restore();
  let modData = copyObj(data);
  delete modData.serviceProfile.ScalingConfig;
  t.is(await app.deleteServiceAlarms(modData), 0);
});

test.serial('deleteServiceAlarms returns 0 if service profile is missing both scaling policies', async t => {
  deleteAlarmsStub.restore();
  let modData = copyObj(data);
  delete modData.serviceProfile.ScalingConfig.ScalingOutPolicy;
  delete modData.serviceProfile.ScalingConfig.ScalingInPolicy;
  t.is(await app.deleteServiceAlarms(modData), 0);
});

test.serial('deleteServiceAlarms returns 0 if service profile is missing both alarms', async t => {
  deleteAlarmsStub.restore();
  let modData = copyObj(data);
  delete modData.serviceProfile.ScalingConfig.ScalingOutPolicy.AlarmName;
  delete modData.serviceProfile.ScalingConfig.ScalingInPolicy.AlarmName;
  t.is(await app.deleteServiceAlarms(modData), 0);
});

test.serial('deleteServiceAlarms checks if alarms exists', async t => {
  deleteAlarmsStub.restore();
  doesAlarmExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingOutPolicy.AlarmName).returns(false);
  doesAlarmExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingInPolicy.AlarmName).returns(false);
  await app.deleteServiceAlarms(copyObj(data));
  t.true(doesAlarmExistStub.calledWith(data.serviceProfile.ScalingConfig.ScalingOutPolicy.AlarmName));
  t.true(doesAlarmExistStub.calledWith(data.serviceProfile.ScalingConfig.ScalingInPolicy.AlarmName));
});

test.serial('deleteServiceAlarms returns 0 if no alarms exist', async t => {
  deleteAlarmsStub.restore();
  doesAlarmExistStub.returns(false);
  t.is(await app.deleteServiceAlarms(copyObj(data)), 0);
});

test.serial('doesAlarmExist gets the alarm description', async t => {
  doesAlarmExistStub.restore();
  await app.doesAlarmExist('abc')
  t.true(getAlarmDescriptionStub.called);
});

test.serial('doesAlarmExist returns false if undefined alarm description received', async t => {
  doesAlarmExistStub.restore();
  getAlarmDescriptionStub.returns(undefined);
  t.false(await app.doesAlarmExist('abc'));
});

test.serial('doesAlarmExist returns true if alarm description is not undefined', async t => {
  doesAlarmExistStub.restore();
  getAlarmDescriptionStub.returns(alarmDescription);
  t.true(await app.doesAlarmExist('abc'));
});

test.serial('describeAlarms returns alarm description', async t => {
  getAlarmDescriptionStub.restore();
  const describeAlarmsMock = sinon.mock();
  describeAlarmsMock.resolves(describeAlarmSdkResp);
  app.deps = () => Promise.resolve({ describeAlarms: describeAlarmsMock });
  app.dependencies = await app.deps();
  t.deepEqual(await app.describeAlarms('abc'), alarmDescription);
});

test.serial('describeAlarms returns undefined if alarm not found', async t => {
  getAlarmDescriptionStub.restore();
  const describeAlarmsMock = sinon.mock();
  describeAlarmsMock.resolves(describeAlarmSdkRespNotFound);
  app.deps = () => Promise.resolve({ describeAlarms: describeAlarmsMock });
  app.dependencies = await app.deps();
  t.is(await app.describeAlarms('abc'), undefined);
});

test.serial('deleteServiceAlarms deletes alarms if they exist', async t => {
  deleteAlarmsStub.restore();
  doesAlarmExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingOutPolicy.AlarmName).returns(true);
  doesAlarmExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingInPolicy.AlarmName).returns(true);
  const ct = await app.deleteServiceAlarms(copyObj(data));
  t.true(deleteAlarmStub.calledWith(data.serviceProfile.ScalingConfig.ScalingOutPolicy.AlarmName));
  t.true(deleteAlarmStub.calledWith(data.serviceProfile.ScalingConfig.ScalingInPolicy.AlarmName));
  t.is(ct, 2);
});

test.serial('deleteServiceAlarms only deletes alarms that exist', async t => {
  deleteAlarmsStub.restore();
  doesAlarmExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingOutPolicy.AlarmName).returns(false);
  doesAlarmExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingInPolicy.AlarmName).returns(true);
  const ct = await app.deleteServiceAlarms(copyObj(data));
  t.false(deleteAlarmStub.calledWith(data.serviceProfile.ScalingConfig.ScalingOutPolicy.AlarmName));
  t.true(deleteAlarmStub.calledWith(data.serviceProfile.ScalingConfig.ScalingInPolicy.AlarmName));
  t.is(ct, 1);
});

test.serial('deletePolicies returns 0 if service profile is missing scaling configuration', async t => {
  deletePoliciesStub.restore();
  let modData = copyObj(data);
  delete modData.serviceProfile.ScalingConfig;
  t.is(await app.deletePolicies(modData), 0);
});

test.serial('deletePolicies returns 0 if service profile is missing both scaling policies', async t => {
  deletePoliciesStub.restore();
  let modData = copyObj(data);
  delete modData.serviceProfile.ScalingConfig.ScalingOutPolicy;
  delete modData.serviceProfile.ScalingConfig.ScalingInPolicy;
  t.is(await app.deletePolicies(modData), 0);
});

test.serial('deletePolicies returns 0 if service profile is missing both policies', async t => {
  deletePoliciesStub.restore();
  let modData = copyObj(data);
  delete modData.serviceProfile.ScalingConfig.ScalingOutPolicy.PolicyName;
  delete modData.serviceProfile.ScalingConfig.ScalingInPolicy.PolicyName;
  t.is(await app.deletePolicies(modData), 0);
});

test.serial('deletePolicies checks if policies exists', async t => {
  deletePoliciesStub.restore();
  doesPolicyExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingOutPolicy.PolicyName).returns(false);
  doesPolicyExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingInPolicy.PolicyName).returns(false);
  await app.deletePolicies(copyObj(data));
  t.true(doesPolicyExistStub.calledWith(data.serviceProfile.ScalingConfig.ScalingOutPolicy.PolicyName));
  t.true(doesPolicyExistStub.calledWith(data.serviceProfile.ScalingConfig.ScalingInPolicy.PolicyName));
});

test.serial('deletePolicies returns 0 if no alarms exist', async t => {
  deletePoliciesStub.restore();
  doesPolicyExistStub.returns(false);
  t.is(await app.deletePolicies(copyObj(data)), 0);
});

test.serial('doesPolicyExist gets the policy description', async t => {
  doesPolicyExistStub.restore();
  await app.doesPolicyExist('abc')
  t.true(getPolicyDescriptionStub.called);
});

test.serial('doesPolicyExist returns false if undefined policy description received', async t => {
  doesPolicyExistStub.restore();
  getPolicyDescriptionStub.returns(undefined);
  t.false(await app.doesPolicyExist('abc'));
});

test.serial('doesPolicyExist returns true if policy description is not undefined', async t => {
  doesPolicyExistStub.restore();
  getPolicyDescriptionStub.returns(policyDescription);
  t.true(await app.doesPolicyExist('abc'));
});

test.serial('describeScalingPolicies returns policy description', async t => {
  getPolicyDescriptionStub.restore();
  const describePoliciesMock = sinon.mock();
  describePoliciesMock.resolves(describePoliciesSdkResp);
  app.deps = () => Promise.resolve({ describeScalingPolicies: describePoliciesMock });
  app.dependencies = await app.deps();
  t.deepEqual(await app.describeScalingPolicies('abc'), policyDescription);
});

test.serial('describeScalingPolicies returns undefined if policy not found', async t => {
  getPolicyDescriptionStub.restore();
  const describePoliciesMock = sinon.mock();
  describePoliciesMock.resolves(describePoliciesSdkRespNotFound);
  app.deps = () => Promise.resolve({ describeScalingPolicies: describePoliciesMock });
  app.dependencies = await app.deps();
  t.is(await app.describeScalingPolicies('abc'), undefined);
});

test.serial('deletePolicies deletes policies if they exist', async t => {
  deletePoliciesStub.restore();
  doesPolicyExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingOutPolicy.PolicyName).returns(true);
  doesPolicyExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingInPolicy.PolicyName).returns(true);
  const ct = await app.deletePolicies(copyObj(data));
  t.true(deleteScalingPolicyStub.calledWith(data.serviceProfile.ScalingConfig.ScalingOutPolicy.PolicyName));
  t.true(deleteScalingPolicyStub.calledWith(data.serviceProfile.ScalingConfig.ScalingInPolicy.PolicyName));
  t.is(ct, 2);
});

test.serial('deletePolicies only deletes policies that exist', async t => {
  deletePoliciesStub.restore();
  doesPolicyExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingOutPolicy.PolicyName).returns(false);
  doesPolicyExistStub.withArgs(data.serviceProfile.ScalingConfig.ScalingInPolicy.PolicyName).returns(true);
  const ct = await app.deletePolicies(copyObj(data));
  t.false(deleteScalingPolicyStub.calledWith(data.serviceProfile.ScalingConfig.ScalingOutPolicy.PolicyName));
  t.true(deleteScalingPolicyStub.calledWith(data.serviceProfile.ScalingConfig.ScalingInPolicy.PolicyName));
  t.is(ct, 1);
});

test.serial('deleteProfile deletes s3 service profile object', async t => {
  deleteProfileStub.restore();
  await app.deleteProfile(data);
  t.true(deleteS3ObjectStub.calledWith(data.bucketName, data.serviceProfileKey));
});

test.serial('deleteProfile gets count of remaining objects in bucket', async t => {
  deleteProfileStub.restore();
  await app.deleteProfile(data);
  t.true(getObjectsCountForBucketStub.calledWith(data.bucketName));
});

test.serial('deleteProfile deletes bucket if it is empty', async t => {
  deleteProfileStub.restore();
  getObjectsCountForBucketStub.returns(0);
  await app.deleteProfile(data);
  t.true(deleteS3BucketStub.calledWith(data.bucketName));
});

test.serial('deleteProfile does not delete bucket if it is not empty', async t => {
  deleteProfileStub.restore();
  getObjectsCountForBucketStub.returns(1);
  await app.deleteProfile(data);
  t.false(deleteS3BucketStub.called);
});