module.exports = {
  services:
    [{
      serviceArn:
        'arn:aws:ecs:us-east-1:064143131841:service/sb-cluster/sb-service',
      serviceName: 'sb-service',
      clusterArn: 'arn:aws:ecs:us-east-1:064143131841:cluster/sb-cluster',
      loadBalancers: [Array],
      serviceRegistries: [],
      status: 'ACTIVE',
      desiredCount: 2,
      runningCount: 2,
      pendingCount: 0,
      launchType: 'EC2',
      taskDefinition:
        'arn:aws:ecs:us-east-1:064143131841:task-definition/sb-taskdef:33',
      deploymentConfiguration: [Object],
      deployments: [Array],
      roleArn: 'arn:aws:iam::064143131841:role/sb-ecs-role',
      events: [Array],
      createdAt: '2018 - 12 - 08T19: 51: 36.915Z',
      placementConstraints: [],
      placementStrategy: [],
      healthCheckGracePeriodSeconds: 60,
      schedulingStrategy: 'REPLICA',
      enableECSManagedTags: false,
      propagateTags: 'NONE'
    }],
  failures: []
}