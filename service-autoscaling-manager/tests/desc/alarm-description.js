module.exports = {
  AlarmName: 'sb-HealthcheckAlarmPrimaryHttps',
  AlarmArn:
    'arn:aws:cloudwatch:us-east-1:064143131841:alarm:sb-HealthcheckAlarmPrimaryHttps',
  AlarmDescription: 'DNS healthcheck failed for primary endpoint https',
  AlarmConfigurationUpdatedTimestamp: '2018 - 12 - 07T17: 57: 02.188Z',
  ActionsEnabled: true,
  OKActions: [],
  AlarmActions: [Array],
  InsufficientDataActions: [],
  StateValue: 'OK',
  StateReason:
    'Threshold Crossed: 1 datapoint [1.0 (08/12/18 19:55:00)] was not less than the threshold (1.0).',
  StateReasonData:
    '{"version":"1.0","queryDate":"2018-12-08T19:56:14.594+0000","startDate":"2018-12-08T19:53:00.000+0000","statistic":"Minimum","period":60,"recentDatapoints":[0.0,0.0,1.0],"threshold":1.0}',
  StateUpdatedTimestamp: '2018 - 12 - 08T19: 56: 14.601Z',
  MetricName: 'HealthCheckStatus',
  Namespace: 'AWS/Route53',
  Statistic: 'Minimum',
  Dimensions: [Array],
  Period: 60,
  EvaluationPeriods: 3,
  Threshold: 1,
  ComparisonOperator: 'LessThanThreshold',
  Metrics: []
};