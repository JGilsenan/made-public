"use strict";

exports.dependencies = {};
exports.debug;

exports.setEnvironment = () => {
  exports.debug = process.env.DEBUG_DETAILS;
};

exports.deps = async () => {
  const AWS = require("aws-sdk");
  const ecs = new AWS.ECS();
  const s3 = new AWS.S3();
  const cw = new AWS.CloudWatch();
  const aas = new AWS.ApplicationAutoScaling();

  return Promise.resolve({
    describeTasks: params => ecs.describeTasks(params).promise(),
    describeServices: params => ecs.describeServices(params).promise(),
    describeTaskDefinition: params => ecs.describeTaskDefinition(params).promise(),
    listBuckets: params => s3.listBuckets(params).promise(),
    listObjects: params => s3.listObjectsV2(params).promise(),
    getObject: params => s3.getObject(params).promise(),
    describeAlarms: params => cw.describeAlarms(params).promise(),
    deleteAlarms: params => cw.deleteAlarms(params).promise(),
    putMetricAlarm: params => cw.putMetricAlarm(params).promise(),
    describeScalingPolicies: params => aas.describeScalingPolicies(params).promise(),
    deleteScalingPolicy: params => aas.deleteScalingPolicy(params).promise(),
    describeScalableTargets: params => aas.describeScalableTargets(params).promise(),
    putScalingPolicy: params => aas.putScalingPolicy(params).promise(),
    deleteObject: params => s3.deleteObject(params).promise(),
    waitForObjectNotExists: params => s3.waitFor("objectNotExists", params).promise(),
    deleteBucket: params => s3.deleteBucket(params).promise(),
    waitForBucketNotExists: params => s3.waitFor("bucketNotExists", params).promise(),
    createBucket: params => s3.createBucket(params).promise(),
    waitForBucketExists: params => s3.waitFor("bucketExists", params).promise(),
    putObject: params => s3.putObject(params).promise(),
    waitForObjectExists: params => s3.waitFor("objectExists", params).promise()
  });
};

exports.deleteAlarms = async (alarmName, debugLevel) => {
  if (!alarmName) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Deleting Alarm', debugLevel, alarmName, false);
  await exports.dependencies.deleteAlarms({ AlarmNames: [alarmName] });
};

exports.describeAlarms = async (alarmName, debugLevel) => {
  if (!alarmName) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Getting Alarm Description: ', debugLevel, alarmName, false);
  const resp = await exports.dependencies.describeAlarms({ AlarmNames: [alarmName] });
  const desc = !resp.MetricAlarms.length ? undefined : resp.MetricAlarms[0];
  debugPrintout('Alarm Description', debugLevel + 1, desc);
  return desc;
};

exports.doesAlarmExist = async (alarmName, debugLevel) => {
  if (!alarmName) {
    throw new Error("Missing required arguments");
  }
  debugPrintout('Checking If Alarm Exists', debugLevel, alarmName, false);
  const desc = await exports.describeAlarms(alarmName, debugLevel + 1);
  const exists = desc !== undefined;
  debugPrintout('Alarm Exists', debugLevel + 1, exists, false);
  return exists;
};

exports.putMetricAlarm = async (name, action, compOperator, serviceName, metricName, debugLevel) => {
  if (!name || !action || !compOperator || !serviceName || !metricName) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Putting Scaling Alarms', debugLevel, name, false);
  await exports.dependencies.putMetricAlarm({
    AlarmName: name,
    ComparisonOperator: compOperator,
    EvaluationPeriods: 3,
    Threshold: 0,
    ActionsEnabled: true,
    AlarmActions: [action],
    AlarmDescription: "Alarm to trigger scaling policy",
    Dimensions: [{ Name: "EcsServiceName", Value: serviceName }],
    MetricName: metricName,
    Namespace: "ecs",
    Period: 60,
    Statistic: "Average",
    TreatMissingData: "notBreaching",
    Unit: "Count"
  });
  debugPrintout('Alarm Created', debugLevel + 1);
};

exports.createBucket = async (bucketName, debugLevel) => {
  if (!bucketName) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Creating S3 Bucket', debugLevel, bucketName, false);
  const resp = await exports.dependencies.createBucket({ Bucket: bucketName });
  await exports.dependencies.waitForBucketExists({ Bucket: bucketName });
  debugPrintout('Bucket Created', debugLevel + 1, resp.Location, false);
  return resp.Location;
};

exports.doesBucketExist = async (bucketName, debugLevel) => {
  if (!bucketName) {
    throw new Error("Missing arguments");
  }
  debugPrintout('Checking If Bucket Exists', debugLevel, bucketName, false);
  const bucketList = await exports.listBuckets(debugLevel + 1);
  const exists = !(bucketList.length === 0 || !bucketList.includes(bucketName));
  debugPrintout('Bucket Exists', debugLevel + 1, exists, false);
  return exists;
};

exports.deleteBucket = async (bucketName, debugLevel) => {
  if (!bucketName) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Deleting S3 Bucket', debugLevel, bucketName, false);
  await exports.dependencies.deleteBucket({ Bucket: bucketName });
  await exports.dependencies.waitForBucketNotExists({ Bucket: bucketName });
  debugPrintout('S3 Bucket Deleted', debugLevel + 1);
};

exports.listBuckets = async (debugLevel) => {
  debugPrintout('Getting List Of S3 Buckets', debugLevel);
  const list = await exports.dependencies.listBuckets({});
  const keys = list.Buckets.map(val => val.Name);
  debugPrintout(undefined, debugLevel, keys);
  return keys;
};

exports.deleteObject = async (bucketName, key, debugLevel) => {
  if (!bucketName || !key) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Deleting S3 Object', debugLevel, key, false);
  await exports.dependencies.deleteObject({ Bucket: bucketName, Key: key });
  await exports.dependencies.waitForObjectNotExists({ Bucket: bucketName, Key: key });
  debugPrintout('S3 Object Deleted', debugLevel + 1);
};

exports.doesObjectExist = async (bucketName, serviceProfileKey) => {
  if (!bucketName || !serviceProfileKey) {
    throw new Error("Missing arguments");
  }
  debugPrintout('Checking If Bucket Object Exists', 3, serviceProfileKey, false);
  const objectsList = await exports.listObjects(bucketName, 4);
  const exists = !(objectsList.length === 0 || !objectsList.includes(serviceProfileKey));
  debugPrintout('Object Exists', 4, exists, false);
  return exists;
};

exports.getObject = async (bucketName, serviceProfileKey, debugLevel) => {
  if (!bucketName || !serviceProfileKey) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Getting S3 Bucket Object', debugLevel, serviceProfileKey);
  const object = await exports.dependencies.getObject({ Bucket: bucketName, Key: serviceProfileKey });
  const objParsed = JSON.parse(object.Body);
  debugPrintout('S3 Bucket Object', debugLevel + 1, objParsed);
  return objParsed;
};

exports.listObjects = async (bucketName, debugLevel) => {
  if (!bucketName) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Getting List Of S3 Bucket Objects In Bucket', debugLevel, bucketName, false);
  const list = await exports.dependencies.listObjects({ Bucket: bucketName });
  const keys = list.Contents.map(obj => obj.Key);
  debugPrintout('Objects', debugLevel, keys);
  return keys;
};

exports.putObject = async (bucket, key, object, debugLevel) => {
  if (!bucket || !key || !object) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Putting S3 Bucket Object', debugLevel, key, false);
  const resp = await exports.dependencies.putObject({ Body: new Buffer.from(JSON.stringify(object)), Bucket: bucket, Key: key });
  await exports.dependencies.waitForObjectExists({ Bucket: bucket, Key: key });
  debugPrintout('Bucket Object Uploaded', debugLevel + 1, resp.ETag, false);
  return resp.ETag;
};

exports.deleteScalingPolicy = async (policyName, resourceId, debugLevel) => {
  if (!policyName || !resourceId) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Deleting Policy', debugLevel, policyName, false);
  await exports.dependencies.deleteScalingPolicy({
    ServiceNamespace: "ecs",
    PolicyName: policyName,
    ScalableDimension: "ecs:service:DesiredCount",
    ResourceId: resourceId
  });
};

exports.describeScalingPolicies = async (policyName, debugLevel) => {
  if (!policyName) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Getting Policy Description: ', debugLevel, policyName, false);
  let resp = await exports.dependencies.describeScalingPolicies({
    ServiceNamespace: "ecs",
    PolicyNames: [policyName]
  });
  const desc = !resp.ScalingPolicies.length ? undefined : resp.ScalingPolicies[0];
  debugPrintout('Policy Description', debugLevel + 1, desc);
  return desc;
};

exports.doesPolicyExist = async (policyName, debugLevel) => {
  if (!policyName) {
    throw new Error("Missing required arguments");
  }
  debugPrintout('Checking If Policy Exists', debugLevel, policyName, false);
  const desc = await exports.describeScalingPolicies(policyName, debugLevel + 1);
  const exists = desc !== undefined;
  debugPrintout('Policy Exists', debugLevel + 1, exists, false);
  return exists;
};

exports.putScalingPolicy = async (name, resourceId, stepConfig, debugLevel) => {
  if (!name || !resourceId || !stepConfig) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Putting Scaling Policy', debugLevel, name, false);
  const resp = await exports.dependencies.putScalingPolicy({
    PolicyName: name,
    ResourceId: resourceId,
    ScalableDimension: "ecs:service:DesiredCount",
    ServiceNamespace: "ecs",
    PolicyType: "StepScaling",
    StepScalingPolicyConfiguration: stepConfig
  });
  debugPrintout('Policy Created', debugLevel + 1, resp.PolicyARN, false);
  return resp.PolicyARN;
};

exports.describeScalableTargets = async (clusterName, serviceName, debugLevel) => {
  if (!clusterName || !serviceName) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Getting Scalable Target Description For Service: ', debugLevel, serviceName, false);
  const desc = await exports.dependencies.describeScalableTargets({ ServiceNamespace: "ecs", ResourceIds: ["service/" + clusterName + "/" + serviceName] });
  debugPrintout('Scalable Target Description', debugLevel + 1, desc);
  return desc.ScalableTargets.length === 0 ? undefined : desc.ScalableTargets[0];
};

exports.describeTasks = async (clusterArn, taskArn) => {
  if (!clusterArn || !taskArn) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Describing Task', 3, taskArn, false);
  const desc = await exports.dependencies.describeTasks({ cluster: clusterArn, tasks: [taskArn] });
  debugPrintout('Task Description', 4, desc);
  if (desc.tasks.length === 0) throw new Error("Failed to describe task");
  return desc.tasks[0];
};

exports.describeTaskDefinition = async (taskDef, debugLevel) => {
  if (!taskDef) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Getting Task Definition Description', debugLevel, taskDef, false);
  const desc = await exports.dependencies.describeTaskDefinition({ taskDefinition: taskDef });
  debugPrintout('Task Definition Description', debugLevel + 1, desc);
  return desc.taskDefinition;
};

exports.describeServices = async (clusterArn, serviceName) => {
  if (!clusterArn || !serviceName) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Getting Service Description', 3, serviceName, false);
  const desc = await exports.dependencies.describeServices({ cluster: clusterArn, services: [serviceName] });
  debugPrintout('Service Description', 4, desc);
  if (desc.services.length === 0) throw new Error("Failed to describe service");
  return desc.services[0];
};

exports.updateScalableTarget = async (data) => {
  debugPrintout('Updating Scalable Target In Profile', 2);
  const desc = await exports.describeScalableTargets(data.clusterName, data.serviceName, 3);
  if (!desc && data.serviceProfile.Scalable) {
    debugPrintout('Deleting Service Scaling Resources', 3);
    await exports.deleteServiceAlarms(data, 4);
    await exports.deletePolicies(data, 4);
    data.serviceProfile.Scalable = false;
    if (data.serviceProfile.hasOwnProperty("ScalingConfig")) delete data.serviceProfile.ScalingConfig;
  } else if (desc && !data.serviceProfile.Scalable) {
    debugPrintout('Creating Service Scaling Resources', 3);
    data.serviceProfile.Scalable = true;
    data.serviceProfile.ScalingConfig = {
      ScalableTarget: {
        ResourceId: desc.ResourceId,
        MinCapacity: desc.MinCapacity,
        MaxCapacity: desc.MaxCapacity
      }
    };
    data = await exports.createScalingResources(data, 4);
  } else {
    data.serviceProfile.ScalingConfig.ScalableTarget = {
      ResourceId: desc.ResourceId,
      MinCapacity: desc.MinCapacity,
      MaxCapacity: desc.MaxCapacity
    };
  }
  return data;
};

exports.isScalableTargetModified = async (data) => {
  debugPrintout('Checking If Scalable Target Has Been Updated', 2);
  const desc = await exports.describeScalableTargets(data.clusterName, data.serviceName, 3);
  const prof = data.serviceProfile;
  if (!desc && prof.Scalable) {
    debugPrintout('Scalable Target Updated', 3, 'Scalable target no longer exists for service ==> Updated: true');
    return true;
  } else if (desc && !prof.Scalable) {
    debugPrintout('Scalable Target Updated', 3, 'Scalable target added to service ==> Updated: true');
    return true;
  } else if (!desc && !prof.Scalable) {
    debugPrintout('Scalable Target Updated', 3, 'Service does not have an associated scalable target ==> Updated: false');
    return false;
  } else if (desc.MinCapacity !== prof.ScalingConfig.ScalableTarget.MinCapacity ||
    desc.MaxCapacity !== prof.ScalingConfig.ScalableTarget.MaxCapacity) {
    debugPrintout('Scalable Target Updated', 3, 'Scalable target properties have been modified ==> Updated: true');
    return true;
  }
  debugPrintout('Scalable Target Updated', 3, 'false');
  return false;
};

exports.updateTask = async (data) => {
  debugPrintout('Updating Task In Profile', 2);
  data.serviceProfile.Task = { DefinitionArn: data.taskDefArn };
  debugPrintout('Updated Task Definition ARN', 3, data.serviceProfile.Task.DefinitionArn, false);
  data = await exports.profileTaskDefinition(data, 3);
  debugPrintout('Task Update Complete', 3);
  return data;
};

exports.isTaskModified = (data) => {
  debugPrintout('Checking If Task Has Been Updated', 2);
  const isTaskUpdated = (data.serviceProfile.Task.DefinitionArn !== data.taskDefArn);
  debugPrintout(undefined, 2, isTaskUpdated, false);
  return isTaskUpdated;
};

exports.checkForUpdates = async (data) => {
  debugPrintout('Checking If Service Is Being Updated', 1);
  const taskModified = exports.isTaskModified(data);
  if (taskModified) {
    await exports.updateTask(data);
  }
  const targetModified = await exports.isScalableTargetModified(data);
  if (targetModified) {
    await exports.updateScalableTarget(data);
  }
  if (taskModified || targetModified) {
    await exports.uploadProfile(data, 2);
    return "Service updated";
  }
  return "Service update check completed: no updates required";
};

exports.setupFailureRollback = async (data, err) => {
  debugPrintout('Error Occurred In The Creation Of Service Auto Scale Resources', 1, 'Rolling back...', false);
  await exports.deleteService(data);
  debugPrintout('Rollback Complete', 2);
  return Promise.reject(err);
};

exports.uploadProfile = async (data, debugLevel) => {
  debugPrintout('Uploading Service Profile', debugLevel);
  if (!(await exports.doesBucketExist(data.bucketName, debugLevel + 1))) {
    await exports.createBucket(data.bucketName, debugLevel + 1);
  }
  await exports.putObject(data.bucketName, data.serviceProfileKey, data.serviceProfile, debugLevel + 1);
};

exports.createAlarms = async (data, debugLevel) => {
  try {
    debugPrintout('Creating Service Scaling Alarms', debugLevel);
    data.serviceProfile.ScalingConfig.MetricName = "EcsServiceScaling-" + data.serviceName;
    await exports.putMetricAlarm(
      "EcsServiceScaleOutAlarm-" + data.serviceName,
      data.serviceProfile.ScalingConfig.ScalingOutPolicy.PolicyArn,
      "GreaterThanThreshold",
      data.serviceName,
      data.serviceProfile.ScalingConfig.MetricName,
      debugLevel + 1
    );
    data.serviceProfile.ScalingConfig.ScalingOutPolicy.AlarmName = "EcsServiceScaleOutAlarm-" + data.serviceName;
    await exports.putMetricAlarm(
      "EcsServiceScaleInAlarm-" + data.serviceName,
      data.serviceProfile.ScalingConfig.ScalingInPolicy.PolicyArn,
      "LessThanThreshold",
      data.serviceName,
      data.serviceProfile.ScalingConfig.MetricName,
      debugLevel + 1
    );
    data.serviceProfile.ScalingConfig.ScalingInPolicy.AlarmName = "EcsServiceScaleInAlarm-" + data.serviceName;
    return data;
  } catch (err) {
    err.data = data;
    return Promise.reject(err);
  }
};

exports.generateStepConfig = (stepCt, cooldown, negative) => {
  let config = {
    AdjustmentType: "ChangeInCapacity",
    Cooldown: cooldown,
    MetricAggregationType: negative ? "Minimum" : "Maximum",
    StepAdjustments: []
  };
  let atStep = 0;
  for (let i = 0, size = Math.floor(100 / stepCt); i < stepCt - 1; i++ , atStep = negative ? atStep - size : atStep + size) {
    config.StepAdjustments.push({
      ScalingAdjustment: negative ? -1 * (i + 1) : i + 1,
      MetricIntervalUpperBound: negative ? atStep : atStep + size,
      MetricIntervalLowerBound: negative ? atStep - size : atStep
    });
  }
  config.StepAdjustments.push(
    negative ?
      { ScalingAdjustment: -1 * stepCt, MetricIntervalUpperBound: atStep } :
      { ScalingAdjustment: stepCt, MetricIntervalLowerBound: atStep });
  return config;
};

exports.createPolicies = async (data, debugLevel) => {
  try {
    debugPrintout('Creating Service Scaling Policies', debugLevel);
    data.serviceProfile.ScalingConfig.ScalingInPolicy = {
      PolicyName: "Scaling-Policy-In-" + data.serviceName,
      PolicyArn: await exports.putScalingPolicy(
        "Scaling-Policy-In-" + data.serviceName,
        data.serviceProfile.ScalingConfig.ScalableTarget.ResourceId,
        exports.generateStepConfig(20, 60, true),
        debugLevel + 1)
    };
    data.serviceProfile.ScalingConfig.ScalingOutPolicy = {
      PolicyName: "Scaling-Policy-Out-" + data.serviceName,
      PolicyArn: await exports.putScalingPolicy(
        "Scaling-Policy-Out-" + data.serviceName,
        data.serviceProfile.ScalingConfig.ScalableTarget.ResourceId,
        exports.generateStepConfig(20, 60, false),
        debugLevel + 1)
    };
    return data;
  } catch (err) {
    err.data = data;
    return Promise.reject(err);
  }
};

exports.createScalingResources = async (data, debugLevel) => {
  if (!data.serviceProfile.Scalable) {
    return data;
  }
  data = await exports.createPolicies(data, debugLevel);
  data = await exports.createAlarms(data, debugLevel);
  return data;
};

exports.profileScalableTarget = async (data) => {
  debugPrintout('Profiling Scalable Target', 2);
  const desc = await exports.describeScalableTargets(data.clusterName, data.serviceName, 3);
  if (desc === undefined) {
    debugPrintout('Scalable Target Profiled', 3, 'Scalable Target Does Not Exist For Service', false);
    data.serviceProfile.Scalable = false;
    return data;
  }
  data.serviceProfile.Scalable = true;
  data.serviceProfile.ScalingConfig = {
    ScalableTarget: {
      ResourceId: desc.ResourceId,
      MinCapacity: desc.MinCapacity,
      MaxCapacity: desc.MaxCapacity
    }
  };
  debugPrintout('Scalable Target Profiled', 3, data.serviceProfile.ScalingConfig);
  return data;
};

exports.profileTaskDefinition = async (data, debugLevel) => {
  debugPrintout('Profiling Task Definition', debugLevel, data.taskDef, false);
  const desc = await exports.describeTaskDefinition(data.taskDef, debugLevel + 1);
  if (desc.hasOwnProperty("cpu")) {
    data.serviceProfile.Task.Cpu = Number(desc.cpu);
  }
  if (desc.hasOwnProperty("memory")) {
    data.serviceProfile.Task.Mem = Number(desc.memory);
  }
  let cpu = -1;
  let mem = -1;
  let memRes = -1;
  desc.containerDefinitions.forEach(c => {
    if (c.hasOwnProperty("cpu")) {
      cpu = cpu < 0 ? c.cpu : cpu + c.cpu;
    }
    if (c.hasOwnProperty("memory")) {
      mem = mem < 0 ? c.memory : mem + c.memory;
    }
    if (c.hasOwnProperty("memoryReservation")) {
      memRes = memRes < 0 ? c.memoryReservation : memRes + c.memoryReservation;
    }
  });
  if (cpu > 0) {
    data.serviceProfile.Task.ContainersCpu = cpu;
  }
  if (mem > 0) {
    data.serviceProfile.Task.ContainersMem = mem;
  }
  if (memRes > 0) {
    data.serviceProfile.Task.ContainersMemReservation = memRes;
  }
  debugPrintout('Parsed Task Definition', debugLevel + 1, data.serviceProfile.Task);
  return data;
};

exports.createBaseProfile = (data) => {
  data.serviceProfile = {
    ServiceName: data.serviceName,
    ServiceArn: data.serviceArn,
    DesiredCount: data.serviceDesiredCount,
    Task: {
      DefinitionArn: data.taskDefArn
    }
  };
  debugPrintout('Created Base Service Profile', 2, data.serviceProfile);
  return data;
};

exports.createProfile = async (data) => {
  debugPrintout('Creating Service Profile', 1);
  data = exports.createBaseProfile(data);
  data = await exports.profileTaskDefinition(data, 2);
  data = await exports.profileScalableTarget(data);
  return data;
};

exports.createService = async (data) => {
  debugPrintout('Creating Service Scaling Resources', 0);
  try {
    data = await exports.createProfile(data);
    data = await exports.createScalingResources(data, 1);
    await exports.uploadProfile(data, 1);
    return "Service setup completed";
  } catch (err) {
    return await exports.setupFailureRollback(data, err);
  }
};

exports.isServiceBeingCreated = (data) => {
  debugPrintout('Checking If Service Is Being Created', 1);
  const isBeingCreated = (!data.serviceProfile);
  debugPrintout(undefined, 1, isBeingCreated, false);
  return isBeingCreated;
};

exports.getObjectsCountForBucket = async (bucketName, debugLevel) => {
  if (!bucketName) {
    throw new Error("Invalid arguments received");
  }
  debugPrintout('Getting Count Of S3 Objects In Bucket', debugLevel, bucketName, false);
  const keys = await exports.listObjects(bucketName, debugLevel + 1);
  const count = keys.length;
  debugPrintout('Count Of S3 Objects In Bucket', debugLevel + 1, count, false);
  return count;
};

exports.deleteProfile = async (data, debugLevel) => {
  debugPrintout('Deleting Service Profile', debugLevel);
  await exports.deleteObject(data.bucketName, data.serviceProfileKey, debugLevel + 1);
  const remainingObjs = await exports.getObjectsCountForBucket(data.bucketName, debugLevel + 1);
  if (remainingObjs === 0) {
    await exports.deleteBucket(data.bucketName, debugLevel + 1);
  }
};

exports.deletePolicies = async (data, debugLevel, config = data.serviceProfile.ScalingConfig) => {
  debugPrintout('Deleting Service Scaling Policies', debugLevel);
  let deletedCt = 0;
  if (!config) {
    return deletedCt;
  }
  const outPolicyGrp = config.ScalingOutPolicy;
  const inPolicyGrp = config.ScalingInPolicy;
  if (!outPolicyGrp && !inPolicyGrp) {
    return deletedCt;
  }
  let outPolicy = outPolicyGrp ? outPolicyGrp.PolicyName : undefined;
  let inPolicy = inPolicyGrp ? inPolicyGrp.PolicyName : undefined;
  if (!outPolicy && !inPolicy) {
    return deletedCt;
  }
  const resourceId = config.ScalableTarget.ResourceId;
  if (outPolicy !== undefined && (await exports.doesPolicyExist(outPolicy, debugLevel + 1))) {
    await exports.deleteScalingPolicy(outPolicy, resourceId, debugLevel + 1);
    deletedCt++;
  }
  if (inPolicy !== undefined && (await exports.doesPolicyExist(inPolicy, debugLevel + 1))) {
    await exports.deleteScalingPolicy(inPolicy, resourceId, debugLevel + 1);
    deletedCt++;
  }
  debugPrintout('Policies Deleted', debugLevel, deletedCt, false);
  return deletedCt;
};

exports.deleteServiceAlarms = async (data, debugLevel, config = data.serviceProfile.ScalingConfig) => {
  debugPrintout('Deleting Cloudwatch Scaling Alarms', debugLevel);
  let deletedCt = 0;
  if (!config) {
    return deletedCt;
  }
  const outPolicy = config.ScalingOutPolicy;
  const inPolicy = config.ScalingInPolicy;
  if (!outPolicy && !inPolicy) {
    return deletedCt;
  }
  let outAlarm = outPolicy ? outPolicy.AlarmName : undefined;
  let inAlarm = inPolicy ? inPolicy.AlarmName : undefined;
  if (!outAlarm && !inAlarm) {
    return deletedCt;
  }
  if (outAlarm !== undefined && (await exports.doesAlarmExist(outAlarm, debugLevel + 1))) {
    await exports.deleteAlarms(outAlarm, debugLevel + 1);
    deletedCt++;
  }
  if (inAlarm !== undefined && (await exports.doesAlarmExist(inAlarm, debugLevel + 1))) {
    await exports.deleteAlarms(inAlarm, debugLevel + 1);
    deletedCt++;
  }
  debugPrintout('Alarms Deleted', debugLevel, deletedCt, false);
  return deletedCt;
};

exports.deleteService = async (data) => {
  debugPrintout('Deleting Service Scaling Resources', 0);
  if (!data.serviceProfile) {
    return "Service profile DNE, no action taken";
  }
  if (data.serviceProfile.Scalable) {
    await exports.deleteServiceAlarms(data, 1);
    await exports.deletePolicies(data, 1);
  }
  await exports.deleteProfile(data, 1);
  return "Service delete completed";
};

exports.isServiceBeingDeleted = (data) => {
  debugPrintout('Checking If Service Is Being Deleted', 1);
  const isBeingDeleted = (data.serviceStatus !== "ACTIVE" || data.serviceDesiredCount === 0);
  debugPrintout(undefined, 1, isBeingDeleted, false);
  return isBeingDeleted;
};

exports.getServiceProfile = async (data, bucket = data.bucketName, key = data.serviceProfileKey) => {
  debugPrintout('Getting Service Profile', 2);
  if (!(await exports.doesBucketExist(bucket, 3)) ||
    !(await exports.doesObjectExist(bucket, key))) {
    debugPrintout(undefined, 3, 'Service profile does not exist', false);
    return data;
  }
  data.serviceProfile = await exports.getObject(bucket, key, 3);
  return data;
};

exports.processService = async (data) => {
  debugPrintout('Processing Service', 2);
  const serviceDesc = await exports.describeServices(data.clusterArn, data.serviceName);
  data.serviceProfileKey = data.serviceName + ".json";
  data.serviceArn = serviceDesc.serviceArn;
  data.serviceStatus = serviceDesc.status;
  data.serviceDesiredCount = serviceDesc.desiredCount;
  debugPrintout('Parsing Service Description', 3);
  debugPrintout(undefined, 3, 'Profile Key: ' + data.serviceProfileKey, false);
  debugPrintout(undefined, 3, 'ARN: ' + data.serviceArn, false);
  debugPrintout(undefined, 3, 'Status: ' + data.serviceStatus, false);
  debugPrintout(undefined, 3, 'Desired Count: ' + data.serviceDesiredCount, false);
  return data;
};

exports.processTask = async (data) => {
  debugPrintout('Processing Task', 2);
  const taskDesc = await exports.describeTasks(data.clusterArn, data.taskArn);
  data.serviceName = taskDesc.group.split(":")[1];
  debugPrintout('Parsed Service Name', 3, data.serviceName, false);
  if (!data.serviceName) {
    throw new Error("Unable to parse service name from task description");
  }
  return data;
};

exports.parseEvent = (event) => {
  const data = {
    acct: event.account,
    clusterArn: event.detail.clusterArn,
    taskArn: event.detail.taskArn,
    taskDefArn: event.detail.taskDefinitionArn,
    clusterName: event.detail.clusterArn.split("/")[1],
    taskDef: event.detail.taskDefinitionArn.split("/")[1],
    bucketName: event.account + "-" + event.detail.clusterArn.split("/")[1]
  };
  debugPrintout('Parsed Event', 2, data);
  return data;
};

exports.processEvent = async (event) => {
  debugPrintout('Processing Event', 1, event);
  let data = exports.parseEvent(event);
  data = await exports.processTask(data);
  data = await exports.processService(data);
  data = await exports.getServiceProfile(data);
  return data;
};

exports.validateEvent = (event) => {
  debugPrintout('Validating Event', 1, event);
  try {
    if (event.detail.desiredStatus === event.detail.lastStatus) {
      return false;
    }
    return true;
  } catch (err) {
    return false;
  }
};

exports.determineStatus = async (event) => {
  debugPrintout('Determining Service Status', 0);
  if (!exports.validateEvent(event)) {
    return 'Non-actionable event received';
  }
  let data = await exports.processEvent(event);
  if (exports.isServiceBeingDeleted(data)) {
    return await exports.deleteService(data);
  }
  if (exports.isServiceBeingCreated(data)) {
    return await exports.createService(data);
  }
  return await exports.checkForUpdates(data);
};

exports.handler = async (event, context, callback) => {
  try {
    exports.setEnvironment();
    exports.dependencies = await exports.deps();
    const resp = await exports.determineStatus(event);
    callback(undefined, resp);
  } catch (err) {
    callback(err, undefined);
  }
};