import test from "ava";
const sinon = require("sinon");
const app = require("../index");

const event = require("./events/state-change");
const data = require("./data/data-01-base");
const dataTaskParsed = require("./data/data-02-task-parsed");
const dataServiceParsed = require("./data/data-03-service-parsed");
const dataWithProfile = require('./data/data-04-with-retrieved-profile');

const task = require("./desc/task");
const service = require("./desc/service");
const bucketsList = require('./etc/buckets-list');
const objectsList = require('./etc/objects-list');
const serviceProfile = require('./etc/service-profile');

const descTaskResp = require("./responses/task/describe-task");
const descTaskRespNotFound = require("./responses/task/describe-task-not-found");
const descSrvcResp = require("./responses/service/describe-service");
const descSrvcRespNotFound = require("./responses/service/describe-service-not-found");
const listBucketsSdkResp = require('./responses/bucket/list-buckets');
const listBucketsEmptySdkResp = require('./responses/bucket/list-buckets-empty');
const listObjectsSdkResp = require('./responses/bucket/list-objects');
const listObjectsEmptySdkResp = require('./responses/bucket/list-objects-empty');
const getObjectSdkResp = require('./responses/bucket/get-object');

let parseEventStub;
let processTaskStub;
let processServiceStub;
let getTaskDescriptionStub;
let getServiceDescriptionStub;
let getServiceProfileStub;
let doesBucketExistStub;
let getBucketsListStub;
let doesServiceProfileExistStub;
let getBucketObjectsListStub;
let getObjectStub;

const copyObj = obj => JSON.parse(JSON.stringify(obj));

test.before(t => {
  const setEnvironmentStub = sinon.stub(app, "setEnvironment");
  app.debug = false;
});

test.beforeEach(t => {
  parseEventStub = sinon.stub(app, "parseEvent");
  processTaskStub = sinon.stub(app, "processTask");
  processServiceStub = sinon.stub(app, "processService");
  getTaskDescriptionStub = sinon.stub(app, "describeTasks");
  getServiceDescriptionStub = sinon.stub(app, "describeServices");
  getServiceProfileStub = sinon.stub(app, "getServiceProfile");
  doesBucketExistStub = sinon.stub(app, 'doesBucketExist');
  doesBucketExistStub.returns(true);
  getBucketsListStub = sinon.stub(app, 'listBuckets');
  getBucketsListStub.returns(bucketsList);
  doesServiceProfileExistStub = sinon.stub(app, 'doesObjectExist');
  doesServiceProfileExistStub.returns(true);
  getBucketObjectsListStub = sinon.stub(app, 'listObjects');
  getBucketObjectsListStub.returns(objectsList);
  getObjectStub = sinon.stub(app, 'getObject');
});

test.afterEach(t => {
  parseEventStub.restore();
  processTaskStub.restore();
  processServiceStub.restore();
  getTaskDescriptionStub.restore();
  getServiceDescriptionStub.restore();
  getServiceProfileStub.restore();
  doesBucketExistStub.restore();
  getBucketsListStub.restore();
  doesServiceProfileExistStub.restore();
  getBucketObjectsListStub.restore();
  getObjectStub.restore();
});

test.serial("processEvent parses the event data, processes the task, processes the service, and gets the service profile", async t => {
  await app.processEvent(copyObj(event));
  t.true(parseEventStub.called);
  t.true(processTaskStub.called);
  t.true(processServiceStub.called);
  t.true(getServiceProfileStub.called);
});

test.serial("parseEvent parses event data", t => {
  parseEventStub.restore();
  t.deepEqual(app.parseEvent(event), data);
});

test.serial("processTask gets and parses task description", async t => {
  processTaskStub.restore();
  getTaskDescriptionStub.returns(task);
  t.deepEqual(await app.processTask(copyObj(data)), dataTaskParsed);
});

test.serial("describeTasks retrieves task description using aws sdk", async t => {
  getTaskDescriptionStub.restore();
  const mockDescTask = sinon.mock();
  mockDescTask.resolves(descTaskResp);
  app.deps = () => Promise.resolve({ describeTasks: mockDescTask });
  app.dependencies = await app.deps();
  t.deepEqual(await app.describeTasks(data.clusterArn, data.taskArn), task);
});

test.serial("describeTasks throws if task not described", async t => {
  getTaskDescriptionStub.restore();
  const mockDescTask = sinon.mock();
  mockDescTask.resolves(descTaskRespNotFound);
  app.deps = () => Promise.resolve({ describeTasks: mockDescTask });
  app.dependencies = await app.deps();
  await t.throws(app.describeTasks(data.clusterArn, data.taskArn));
});

test.serial("processService gets and parses service description", async t => {
  processServiceStub.restore();
  getServiceDescriptionStub.returns(service);
  t.deepEqual(await app.processService(copyObj(dataTaskParsed)), dataServiceParsed);
});

test.serial("describeServices retrieves service description using aws sdk", async t => {
  getServiceDescriptionStub.restore();
  const mockDescService = sinon.mock();
  mockDescService.resolves(descSrvcResp);
  app.deps = () => Promise.resolve({ describeServices: mockDescService });
  app.dependencies = await app.deps();
  t.deepEqual(await app.describeServices(dataTaskParsed.clusterArn, dataTaskParsed.serviceName), service);
});

test.serial("describeServices throws if service not described", async t => {
  getServiceDescriptionStub.restore();
  const mockDescService = sinon.mock();
  mockDescService.resolves(descSrvcRespNotFound);
  app.deps = () => Promise.resolve({ describeServices: mockDescService });
  app.dependencies = await app.deps();
  await t.throws(app.describeServices(dataTaskParsed.clusterArn, dataTaskParsed.serviceName));
});

test.serial('getServiceProfile checks if bucket exists, if the service profile exists, and gets the profile', async t => {
  getServiceProfileStub.restore();
  await app.getServiceProfile(copyObj(dataServiceParsed));
  t.true(doesBucketExistStub.called);
  t.true(doesServiceProfileExistStub.called);
  t.true(getObjectStub.called);
});

test.serial('getServiceProfile returns if bucket does not exist', async t => {
  getServiceProfileStub.restore();
  doesBucketExistStub.restore();
  getBucketsListStub.returns([]);
  t.deepEqual(await app.getServiceProfile(copyObj(dataServiceParsed)), dataServiceParsed);
});

test.serial('getServiceProfile returns data with service profile', async t => {
  getServiceProfileStub.restore();
  getObjectStub.returns(serviceProfile);
  t.deepEqual(await app.getServiceProfile(copyObj(dataServiceParsed)), dataWithProfile);
});

test.serial('doesBucketExist gets the list of buckets', async t => {
  doesBucketExistStub.restore();
  await app.doesBucketExist(dataServiceParsed.bucketName)
  t.true(getBucketsListStub.called);
});

test.serial('doesBucketExist returns false if buckets list is empty', async t => {
  doesBucketExistStub.restore();
  getBucketsListStub.returns([]);
  t.false(await app.doesBucketExist(dataServiceParsed.bucketName));
});

test.serial('doesBucketExist returns false if buckets list does not contain cluster bucket', async t => {
  doesBucketExistStub.restore();
  getBucketsListStub.returns(['notcorrect1', 'notcorrect2']);
  t.false(await app.doesBucketExist(dataServiceParsed.bucketName));
});

test.serial('doesBucketExist returns true if buckets list does contain cluster bucket', async t => {
  doesBucketExistStub.restore();
  t.true(await app.doesBucketExist(dataServiceParsed.bucketName));
});

test.serial('listBuckets returns a list of bucket names', async t => {
  getBucketsListStub.restore();
  const listBucketsMock = sinon.mock();
  listBucketsMock.resolves(listBucketsSdkResp);
  app.deps = () => Promise.resolve({ listBuckets: listBucketsMock });
  app.dependencies = await app.deps();
  const list = await app.listBuckets();
  bucketsList.forEach(name => t.true(list.includes(name)));
});

test.serial('listBuckets returns a empty list if no buckets exist', async t => {
  getBucketsListStub.restore();
  const listBucketsMock = sinon.mock();
  listBucketsMock.resolves(listBucketsEmptySdkResp);
  app.deps = () => Promise.resolve({ listBuckets: listBucketsMock });
  app.dependencies = await app.deps();
  const bucketList = await app.listBuckets();
  t.true(bucketList.length === 0);
});

test.serial('getServiceProfile returns if service profile does not exist', async t => {
  getServiceProfileStub.restore();
  doesServiceProfileExistStub.restore();
  getBucketObjectsListStub.returns([]);
  t.deepEqual(await app.getServiceProfile(copyObj(dataServiceParsed)), dataServiceParsed);
});

test.serial('doesObjectExist gets the list of bucket objects', async t => {
  doesServiceProfileExistStub.restore();
  await app.doesObjectExist(dataServiceParsed.bucketName, dataServiceParsed.serviceProfileKey);
  t.true(getBucketObjectsListStub.called);
});

test.serial('doesObjectExist returns false if bucket objects list is empty', async t => {
  doesServiceProfileExistStub.restore();
  getBucketObjectsListStub.returns([]);
  t.false(await app.doesObjectExist(dataServiceParsed.bucketName, dataServiceParsed.serviceProfileKey));
});

test.serial('doesBucketExist returns false if buckets list does not contain cluster bucket', async t => {
  doesServiceProfileExistStub.restore();
  getBucketObjectsListStub.returns(['notcorrect1', 'notcorrect2']);
  t.false(await app.doesObjectExist(dataServiceParsed.bucketName, dataServiceParsed.serviceProfileKey));
});

test.serial('doesBucketExist returns true if buckets list does contain cluster bucket', async t => {
  doesServiceProfileExistStub.restore();
  t.true(await app.doesObjectExist(dataServiceParsed.bucketName, dataServiceParsed.serviceProfileKey));
});

test.serial('listObjects returns a list of bucket object keys', async t => {
  getBucketObjectsListStub.restore();
  const listObjectsMock = sinon.mock();
  listObjectsMock.resolves(listObjectsSdkResp);
  app.deps = () => Promise.resolve({ listObjects: listObjectsMock });
  app.dependencies = await app.deps();
  const keys = await app.listObjects(dataServiceParsed.bucketName);
  objectsList.forEach(key => t.true(keys.includes(key)));
});

test.serial('listObjects returns a empty list if no buckets objects exist', async t => {
  getBucketObjectsListStub.restore();
  const listObjectsMock = sinon.mock();
  listObjectsMock.resolves(listObjectsEmptySdkResp);
  app.deps = () => Promise.resolve({ listObjects: listObjectsMock });
  app.dependencies = await app.deps();
  const keys = await app.listObjects(dataServiceParsed.bucketName);
  t.true(keys.length === 0);
});

test.serial('getObject returns the service profile', async t => {
  getObjectStub.restore();
  const getObjectMock = sinon.mock();
  const respMod = copyObj(getObjectSdkResp);
  respMod.Body = new Buffer.from(JSON.stringify(serviceProfile));
  getObjectMock.resolves(respMod);
  app.deps = () => Promise.resolve({ getObject: getObjectMock });
  app.dependencies = await app.deps();
  t.deepEqual(await app.getObject(dataServiceParsed.bucketName, dataServiceParsed.serviceProfileKey), serviceProfile);
});