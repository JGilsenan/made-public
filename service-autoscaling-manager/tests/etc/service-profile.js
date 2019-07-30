module.exports = {
  ServiceName: 'sb-service',
  ServiceArn: 'arn:aws:ecs:us-east-1:064143131841:service/sb-cluster/sb-service',
  DesiredCount: 2,
  Scalable: true,
  Task: {
    DefinitionArn: 'arn:aws:ecs:us-east-1:064143131841:task-definition/sb-taskdef:33',
    Cpu: 900,
    Mem: 950,
    ContainersCpu: 550,
    ContainersMem: 700,
    ContainersMemReservation: 384
  },
  ScalingConfig: {
    MetricName: 'EcsServiceScaling-sb-service',
    ScalableTarget: {
      ResourceId: 'service/sb-cluster/sb-service',
      MinCapacity: 1,
      MaxCapacity: 5
    },
    ScalingOutPolicy: {
      PolicyName: 'Scaling-Policy-Out-sb-service',
      PolicyArn: 'arn:aws:autoscaling:us-west-2:012345678910:scalingPolicy:6d8972f3-efc8-437c-92d1-6270f29a66e7:resource/ecs/service/default/web-app:policyName/web-app-cpu-gt-75',
      AlarmName: 'EcsServiceScaleOutAlarm-sb-service'
    },
    ScalingInPolicy: {
      PolicyName: 'Scaling-Policy-In-sb-service',
      PolicyArn: 'arn:aws:autoscaling:us-west-2:012345678910:scalingPolicy:6d8972f3-efc8-437c-92d1-6270f29a66e7:resource/ecs/service/default/web-app:policyName/web-app-cpu-gt-75',
      AlarmName: 'EcsServiceScaleInAlarm-sb-service'
    }
  }
};