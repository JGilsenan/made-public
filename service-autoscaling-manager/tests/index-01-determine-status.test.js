import test from "ava";
const sinon = require("sinon");
const app = require("../index");

const event = require("./events/state-change");
const eventNoAction = require("./events/no-action");
const data = require("./data/data-03-service-parsed");
const dataWithProfile = require("./data/data-04-with-retrieved-profile");

let processEventStub;
let deleteServiceStub;
let createServiceStub;
let checkForUpdatesStub;
let validateEventStub;

const copyObj = obj => JSON.parse(JSON.stringify(obj));

test.before(t => {
  const setEnvironmentStub = sinon.stub(app, "setEnvironment");
  app.debug = false;
});

test.beforeEach(t => {
  processEventStub = sinon.stub(app, "processEvent");
  processEventStub.returns(dataWithProfile);
  deleteServiceStub = sinon.stub(app, 'deleteService');
  createServiceStub = sinon.stub(app, 'createService');
  checkForUpdatesStub = sinon.stub(app, 'checkForUpdates');
  validateEventStub = sinon.stub(app, 'validateEvent');
  validateEventStub.returns(true);
});

test.afterEach(t => {
  processEventStub.restore();
  deleteServiceStub.restore();
  createServiceStub.restore();
  checkForUpdatesStub.restore();
  validateEventStub.restore();
});

test.serial("determineStatus validates the event, and returns if non-actionable", async t => {
  validateEventStub.returns(false);
  await app.determineStatus(copyObj(eventNoAction));
  t.true(validateEventStub.called);
  t.false(processEventStub.called);
});

test.serial("validateEvent returns false if last status and desired status are the same", async t => {
  validateEventStub.restore();
  t.false(app.validateEvent(copyObj(eventNoAction)));
  t.true(app.validateEvent(copyObj(event)));
});

test.serial("determineStatus processes the event", async t => {
  await app.determineStatus(copyObj(event));
  t.true(processEventStub.called);
});

test.serial("determineStatus deletes service if status is not ACTIVE", async t => {
  const modData = copyObj(dataWithProfile);
  modData.serviceStatus = "DRAINING";
  processEventStub.returns(modData);
  await app.determineStatus(copyObj(event));
  t.true(deleteServiceStub.called);
});

test.serial("determineStatus deletes service if desired count is > 0 and status is active", async t => {
  await app.determineStatus(copyObj(event));
  t.false(deleteServiceStub.called);
});

test.serial("determineStatus does not delete service if desired count is 0", async t => {
  const modData = copyObj(dataWithProfile);
  modData.serviceDesiredCount = 0;
  processEventStub.returns(modData);
  await app.determineStatus(copyObj(event));
  t.true(deleteServiceStub.called);
});

test.serial("determineStatus creates service if profile does not exist", async t => {
  processEventStub.returns(data);
  await app.determineStatus(copyObj(event));
  t.true(createServiceStub.called);
});

test.serial("determineStatus checks for updates if profile exists and not being deleted", async t => {
  await app.determineStatus(copyObj(event));
  t.true(checkForUpdatesStub.called);
});