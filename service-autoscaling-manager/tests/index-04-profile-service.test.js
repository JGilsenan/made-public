import test from 'ava';
const sinon = require('sinon');
const app = require('../index');

const data = require('./data/data-03-service-parsed');
const dataWithBaseProfile = require('./data/data-05-with-base-profile');
const dataWithTaskProfiled = require('./data/data-06-task-profiled');
const dataWithTargetProfiled = require('./data/data-07-target-profiled');

const descTaskDefResp = require('./responses/task/describe-task-definition');
const describeScalableTargetSdkResp = require('./responses/target/describe-scalable-targets');
const describeScalableTargetNotFoundSdkResp = require('./responses/target/describe-scalable-targets-not-found');

const taskDef = require('./desc/task-definition');
const taskDefNoTaskLevel = require('./desc/task-definition-no-task-level');
const taskDefTwoContainers = require('./desc/task-definition-two-containers');
const taskDefNoSize = require('./desc/task-definition-no-size');
const scalableTargetDesc = require('./desc/scalable-target');

let createBaseProfileStub;
let profileTaskDefinitionStub;
let describeTaskDefinitionStub;
let profileScalableTargetStub;
let describeScalableTargetStub;

const copyObj = (obj) => JSON.parse(JSON.stringify(obj));

test.before(t => {
  const setEnvironmentStub = sinon.stub(app, 'setEnvironment');
  app.debug = false;
});

test.beforeEach(t => {
  createBaseProfileStub = sinon.stub(app, 'createBaseProfile');
  createBaseProfileStub.returns(copyObj(dataWithBaseProfile));
  profileTaskDefinitionStub = sinon.stub(app, 'profileTaskDefinition');
  describeTaskDefinitionStub = sinon.stub(app, 'describeTaskDefinition');
  describeTaskDefinitionStub.returns(taskDef);
  profileScalableTargetStub = sinon.stub(app, 'profileScalableTarget');
  describeScalableTargetStub = sinon.stub(app, 'describeScalableTargets');
  describeScalableTargetStub.returns(scalableTargetDesc);
});

test.afterEach(t => {
  createBaseProfileStub.restore();
  profileTaskDefinitionStub.restore();
  describeTaskDefinitionStub.restore();
  profileScalableTargetStub.restore();
  describeScalableTargetStub.restore();
});

test.serial('createProfile creates base profile, profiles task definition, and profiles scalable target', async t => {
  await app.createProfile(copyObj(data));
  t.true(createBaseProfileStub.called);
  t.true(profileTaskDefinitionStub.called);
  t.true(profileScalableTargetStub.called);
});

test.serial('createBaseServiceProfile sets up base service profile', t => {
  createBaseProfileStub.restore();
  t.deepEqual(app.createBaseProfile(copyObj(data)), dataWithBaseProfile);
});

test.serial('profileTaskDefinition retrieves task definition description', async t => {
  profileTaskDefinitionStub.restore();
  await app.profileTaskDefinition(copyObj(dataWithBaseProfile));
  t.true(describeTaskDefinitionStub.called);
});

test.serial('describeTaskDefinition retrieves task definition description using aws sdk', async t => {
  describeTaskDefinitionStub.restore();
  const mockDescTaskDef = sinon.mock();
  mockDescTaskDef.resolves(descTaskDefResp);
  app.deps = () => Promise.resolve({ describeTaskDefinition: mockDescTaskDef });
  app.dependencies = await app.deps();
  t.deepEqual(await app.describeTaskDefinition(data.taskDef), taskDef);
});

test.serial('profileTaskDefinition parses task-level sizes if they exist', async t => {
  profileTaskDefinitionStub.restore();
  const dataMod = await app.profileTaskDefinition(copyObj(dataWithBaseProfile));
  t.is(dataMod.serviceProfile.Task.Cpu, 900);
  t.is(dataMod.serviceProfile.Task.Mem, 950);
});

test.serial('profileTaskDefinition does not parse task-level sizes if they do not exist', async t => {
  profileTaskDefinitionStub.restore();
  describeTaskDefinitionStub.returns(taskDefNoTaskLevel);
  const dataMod = await app.profileTaskDefinition(copyObj(dataWithBaseProfile));
  t.false(dataMod.serviceProfile.Task.hasOwnProperty('Cpu'));
  t.false(dataMod.serviceProfile.Task.hasOwnProperty('Mem'));
});

test.serial('profileTaskDefinition parses container-level sizes if they exist', async t => {
  profileTaskDefinitionStub.restore();
  const dataMod = await app.profileTaskDefinition(copyObj(dataWithBaseProfile));
  t.is(dataMod.serviceProfile.Task.ContainersCpu, 300);
  t.is(dataMod.serviceProfile.Task.ContainersMem, 300);
  t.is(dataMod.serviceProfile.Task.ContainersMemReservation, 128);
});

test.serial('profileTaskDefinition parses container-level sizes cumulatively if multiple containers exist', async t => {
  profileTaskDefinitionStub.restore();
  describeTaskDefinitionStub.returns(taskDefTwoContainers);
  const dataMod = await app.profileTaskDefinition(copyObj(dataWithBaseProfile));
  t.is(dataMod.serviceProfile.Task.ContainersCpu, 550);
  t.is(dataMod.serviceProfile.Task.ContainersMem, 700);
  t.is(dataMod.serviceProfile.Task.ContainersMemReservation, 384);
});

test.serial('profileTaskDefinition does not parse container-level sizes if they do not exist', async t => {
  profileTaskDefinitionStub.restore();
  describeTaskDefinitionStub.returns(taskDefNoSize);
  const dataMod = await app.profileTaskDefinition(copyObj(dataWithBaseProfile));
  t.false(dataMod.serviceProfile.Task.hasOwnProperty('ContainersCpu'));
  t.false(dataMod.serviceProfile.Task.hasOwnProperty('ContainersMem'));
  t.false(dataMod.serviceProfile.Task.hasOwnProperty('ContainersMemReservation'));
});

test.serial('profileScalableTarget retrieves scalable target description', async t => {
  profileScalableTargetStub.restore();
  await app.profileScalableTarget(copyObj(dataWithTaskProfiled));
  t.true(describeScalableTargetStub.called);
});

test.serial('describeScalableTargets returns scalable target description', async t => {
  describeScalableTargetStub.restore();
  const describeScalableTargetsMock = sinon.mock();
  describeScalableTargetsMock.resolves(describeScalableTargetSdkResp);
  app.deps = () => Promise.resolve({ describeScalableTargets: describeScalableTargetsMock });
  app.dependencies = await app.deps();
  t.deepEqual(await app.describeScalableTargets('abc', 'def'), scalableTargetDesc);
});

test.serial('describeScalableTargets returns undefined if policy not found', async t => {
  describeScalableTargetStub.restore();
  const describeScalableTargetsMock = sinon.mock();
  describeScalableTargetsMock.resolves(describeScalableTargetNotFoundSdkResp);
  app.deps = () => Promise.resolve({ describeScalableTargets: describeScalableTargetsMock });
  app.dependencies = await app.deps();
  t.is(await app.describeScalableTargets('abc', 'def'), undefined);
});

test.serial('profileScalableTarget sets scalable to false and returns if scalable target not found', async t => {
  profileScalableTargetStub.restore();
  describeScalableTargetStub.returns(undefined);
  const dataMod = await app.profileScalableTarget(copyObj(dataWithTaskProfiled));
  t.false(dataMod.serviceProfile.Scalable);
});

test.serial('profileScalableTarget profiles the scalable target', async t => {
  profileScalableTargetStub.restore();
  t.deepEqual(await app.profileScalableTarget(copyObj(dataWithTaskProfiled)), dataWithTargetProfiled);
});