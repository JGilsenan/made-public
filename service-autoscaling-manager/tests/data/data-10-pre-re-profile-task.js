module.exports = {
  acct: '064143131841',
  clusterArn: 'arn:aws:ecs:us-east-1:064143131841:cluster/sb-cluster',
  clusterName: 'sb-cluster',
  taskArn: 'arn:aws:ecs:us-east-1:064143131841:task/845bdcb25e2d4e008a3370094a309636',
  taskDefArn: 'arn:aws:ecs:us-east-1:064143131841:task-definition/sb-taskdef:34',
  taskDef: 'sb-taskdef:34',
  bucketName: '064143131841-sb-cluster',
  serviceName: 'sb-service',
  serviceProfileKey: 'sb-service.json',
  serviceArn: 'arn:aws:ecs:us-east-1:064143131841:service/sb-cluster/sb-service',
  serviceStatus: 'ACTIVE',
  serviceDesiredCount: 2,
  serviceProfile: {
    ServiceName: 'sb-service',
    ServiceArn: 'arn:aws:ecs:us-east-1:064143131841:service/sb-cluster/sb-service',
    DesiredCount: 2,
    Scalable: true,
    Task: {
      DefinitionArn: 'arn:aws:ecs:us-east-1:064143131841:task-definition/sb-taskdef:34',
    },
    ScalingConfig: {
      ScalableTarget: {
        ResourceId: 'service/sb-cluster/sb-service',
        MinCapacity: 1,
        MaxCapacity: 5
      },
      ScalingOutPolicy: {
        PolicyName: 'Scaling-Policy-Out-sb-service',
        PolicyArn: 'arn:aws:autoscaling:us-west-2:012345678910:scalingPolicy:6d8972f3-efc8-437c-92d1-6270f29a66e7:resource/ecs/service/default/web-app:policyName/web-app-cpu-gt-75',
      },
      ScalingInPolicy: {
        PolicyName: 'Scaling-Policy-In-sb-service',
        PolicyArn: 'arn:aws:autoscaling:us-west-2:012345678910:scalingPolicy:6d8972f3-efc8-437c-92d1-6270f29a66e7:resource/ecs/service/default/web-app:policyName/web-app-cpu-gt-75',
      }
    }
  }
};