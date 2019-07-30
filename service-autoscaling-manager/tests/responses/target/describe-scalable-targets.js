module.exports = {
  ScalableTargets:
    [{
      ServiceNamespace: 'ecs',
      ResourceId: 'service/sb-cluster/sb-service',
      ScalableDimension: 'ecs:service:DesiredCount',
      MinCapacity: 1,
      MaxCapacity: 5,
      RoleARN:
        'arn:aws:iam::064143131841:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService',
      CreationTime: '2018 - 12 - 08T19: 52: 41.236Z'
    }]
};