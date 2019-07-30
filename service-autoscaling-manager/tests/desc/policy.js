module.exports = {
  Alarms: [
    {
      AlarmARN: "arn:aws:cloudwatch:us-west-2:012345678910:alarm:web-app-cpu-gt-75",
      AlarmName: "web-app-cpu-gt-75"
    }
  ],
  CreationTime: '<Date Representation>',
  PolicyARN: "arn:aws:autoscaling:us-west-2:012345678910:scalingPolicy:6d8972f3-efc8-437c-92d1-6270f29a66e7:resource/ecs/service/default/web-app:policyName/web-app-cpu-gt-75",
  PolicyName: "web-app-cpu-gt-75",
  PolicyType: "StepScaling",
  ResourceId: "service/default/web-app",
  ScalableDimension: "ecs:service:DesiredCount",
  ServiceNamespace: "ecs",
  StepScalingPolicyConfiguration: {
    AdjustmentType: "PercentChangeInCapacity",
    Cooldown: 60,
    StepAdjustments: [
      {
        MetricIntervalLowerBound: 0,
        ScalingAdjustment: 200
      }
    ]
  }
};