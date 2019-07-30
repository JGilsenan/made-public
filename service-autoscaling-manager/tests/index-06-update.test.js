import test from "ava";
const sinon = require("sinon");
const app = require("../index");

const data = require("./data/data-09-pre-update-task");
const dataPreReProfileTask = require("./data/data-10-pre-re-profile-task");
const dataPostUpdateTarget = require("./data/data-11-post-update-scalable-target");

const scalableTargetDesc = require('./desc/scalable-target');
const scalableTargetDescChanged = require('./desc/scalable-target-changed-desc');

let isTaskModifiedStub;
let updateTaskStub;
let profileTaskDefinitionStub;
let isScalableTargetModifiedStub;
let describeScalableTargetStub;
let updateScalableTargetStub;
let deleteAlarmsStub;
let deletePoliciesStub;
let createScalingResourcesStub;
let uploadProfileStub;

const copyObj = obj => JSON.parse(JSON.stringify(obj));

test.before(t => {
  const setEnvironmentStub = sinon.stub(app, "setEnvironment");
  app.debug = false;
});

test.beforeEach(t => {
  isTaskModifiedStub = sinon.stub(app, "isTaskModified");
  updateTaskStub = sinon.stub(app, "updateTask");
  profileTaskDefinitionStub = sinon.stub(app, "profileTaskDefinition");
  isScalableTargetModifiedStub = sinon.stub(app, "isScalableTargetModified");
  describeScalableTargetStub = sinon.stub(app, "describeScalableTargets");
  updateScalableTargetStub = sinon.stub(app, "updateScalableTarget");
  deleteAlarmsStub = sinon.stub(app, "deleteServiceAlarms");
  deletePoliciesStub = sinon.stub(app, "deletePolicies");
  createScalingResourcesStub = sinon.stub(app, "createScalingResources");
  uploadProfileStub = sinon.stub(app, "uploadProfile");
});

test.afterEach(t => {
  isTaskModifiedStub.restore();
  updateTaskStub.restore();
  profileTaskDefinitionStub.restore();
  isScalableTargetModifiedStub.restore();
  describeScalableTargetStub.restore();
  updateScalableTargetStub.restore();
  deleteAlarmsStub.restore();
  deletePoliciesStub.restore();
  createScalingResourcesStub.restore();
  uploadProfileStub.restore();
});

test.serial("checkForUpdates checks if task has changed, if target has changed", async t => {
  await app.checkForUpdates(copyObj(data));
  t.true(isTaskModifiedStub.called);
  t.true(isScalableTargetModifiedStub.called);
});

test.serial("checkForUpdates updates task if task has changed", async t => {
  isTaskModifiedStub.returns(true);
  await app.checkForUpdates(copyObj(data));
  t.true(updateTaskStub.called);
});

test.serial("updateTask re-profiles task definition", async t => {
  updateTaskStub.restore();
  await app.updateTask(copyObj(data));
  t.true(profileTaskDefinitionStub.called);
});

test.serial("updateTask updates task definition arn before re-profiling", async t => {
  updateTaskStub.restore();
  await app.updateTask(copyObj(data));
  t.is(profileTaskDefinitionStub.args[0][0].serviceProfile.Task.DefinitionArn, dataPreReProfileTask.serviceProfile.Task.DefinitionArn);
});

test.serial("updateTask deletes previous task definition details before re-profiling", async t => {
  updateTaskStub.restore();
  await app.updateTask(copyObj(data));
  t.true(profileTaskDefinitionStub.calledWith(dataPreReProfileTask));
});

test.serial("isScalableTargetModified tries to retrieve a description of a scalable target", async t => {
  isScalableTargetModifiedStub.restore();
  await app.isScalableTargetModified(copyObj(data));
  t.true(describeScalableTargetStub.called);
});

test.serial("isScalableTargetModified returns true if service is currently set as scalable and there is no scalable target", async t => {
  isScalableTargetModifiedStub.restore();
  describeScalableTargetStub.returns(undefined);
  t.true(await app.isScalableTargetModified(copyObj(data)));
});

test.serial("isScalableTargetModified returns true if service is not currently set as scalable and there is a scalable target", async t => {
  isScalableTargetModifiedStub.restore();
  describeScalableTargetStub.returns(scalableTargetDesc);
  const dataMod = copyObj(data);
  dataMod.serviceProfile.Scalable = false;
  t.true(await app.isScalableTargetModified(dataMod));
});

test.serial("isScalableTargetModified returns false if service is not currently set as scalable and there is no scalable target", async t => {
  isScalableTargetModifiedStub.restore();
  describeScalableTargetStub.returns(undefined);
  const dataMod = copyObj(data);
  dataMod.serviceProfile.Scalable = false;
  t.false(await app.isScalableTargetModified(dataMod));
});

test.serial("isScalableTargetModified returns true if scalable target has been modified", async t => {
  isScalableTargetModifiedStub.restore();
  describeScalableTargetStub.returns(scalableTargetDescChanged);
  t.true(await app.isScalableTargetModified(data));
});

test.serial("isScalableTargetModified returns false if scalable target has not been modified", async t => {
  isScalableTargetModifiedStub.restore();
  describeScalableTargetStub.returns(scalableTargetDesc);
  t.false(await app.isScalableTargetModified(data));
});

test.serial("checkForUpdates updates target if target has changed", async t => {
  isTaskModifiedStub.returns(false);
  isScalableTargetModifiedStub.returns(true);
  await app.checkForUpdates(copyObj(data));
  t.true(updateScalableTargetStub.called);
});

test.serial("updateScalableTarget tries to retrieve a description of a scalable target", async t => {
  updateScalableTargetStub.restore();
  await app.updateScalableTarget(copyObj(data));
  t.true(describeScalableTargetStub.called);
});

test.serial("updateScalableTarget deletes scaling if service is currently set as scalable and there is no scalable target", async t => {
  updateScalableTargetStub.restore();
  describeScalableTargetStub.returns(undefined);
  await app.updateScalableTarget(copyObj(data));
  t.true(deleteAlarmsStub.called);
  t.true(deletePoliciesStub.called);
});

test.serial("updateScalableTarget updates profile if scaling resources deleted", async t => {
  updateScalableTargetStub.restore();
  describeScalableTargetStub.returns(undefined);
  const dataMod = await app.updateScalableTarget(copyObj(data));
  t.false(dataMod.serviceProfile.Scalable);
  t.false(dataMod.serviceProfile.hasOwnProperty("ScalingConfig"));
});

test.serial("isScalableTargetModified creates scaling resources if service is not currently set as scalable and there is a scalable target", async t => {
  updateScalableTargetStub.restore();
  describeScalableTargetStub.returns(scalableTargetDesc);
  const dataMod = copyObj(data);
  dataMod.serviceProfile.Scalable = false;
  await app.updateScalableTarget(dataMod);
  t.true(createScalingResourcesStub.called);
});

test.serial("isScalableTargetModified profiles scalable target before creating scaling resources", async t => {
  updateScalableTargetStub.restore();
  describeScalableTargetStub.returns(scalableTargetDesc);
  const dataMod = copyObj(data);
  dataMod.serviceProfile.Scalable = false;
  delete dataMod.serviceProfile.ScalingConfig;
  await app.updateScalableTarget(dataMod);
  const dataArg = createScalingResourcesStub.args[0][0];
  t.true(dataArg.serviceProfile.Scalable);
  t.true(dataArg.serviceProfile.hasOwnProperty("ScalingConfig"));
});

test.serial("updateScalableTarget updates profile only if nothing is created or deleted", async t => {
  updateScalableTargetStub.restore();
  describeScalableTargetStub.returns(scalableTargetDescChanged);
  t.false(deleteAlarmsStub.called);
  t.false(deletePoliciesStub.called);
  t.false(createScalingResourcesStub.called);
  t.deepEqual(await app.updateScalableTarget(copyObj(dataPreReProfileTask)), dataPostUpdateTarget);
});

test.serial("checkForUpdates updates uploads new profile if updates have occurred", async t => {
  isTaskModifiedStub.returns(false);
  isScalableTargetModifiedStub.returns(true);
  await app.checkForUpdates(copyObj(data));
  t.true(uploadProfileStub.called);
});