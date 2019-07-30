module.exports = {
  version: '0',
  id: 'ff2dd97a-e19a-c545-92da-5165c1c32a95',
  'detail-type': 'ECS Task State Change',
  source: 'aws.ecs',
  account: '064143131841',
  time: '2018-12-08T19:51:40Z',
  region: 'us-east-1',
  resources:
    ['arn:aws:ecs:us-east-1:064143131841:task/sb-cluster/845bdcb25e2d4e008a3370094a309636'],
  detail:
  {
    clusterArn: 'arn:aws:ecs:us-east-1:064143131841:cluster/sb-cluster',
    containerInstanceArn: 'arn:aws:ecs:us-east-1:064143131841:container-instance/56f8b95b33174abcbde5faa1a070e28c',
    containers: [[Object]],
    createdAt: '2018-12-08T19:51:38.374Z',
    launchType: 'EC2',
    cpu: '300',
    memory: '300',
    desiredStatus: 'RUNNING',
    group: 'service:sb-service',
    lastStatus: 'RUNNING',
    overrides: { containerOverrides: [Array] },
    attachments: [],
    connectivity: 'CONNECTED',
    pullStartedAt: '2018-12-08T19:51:40.567Z',
    startedAt: '2018-12-08T19:51:40.567Z',
    startedBy: 'ecs-svc/9223370492556078888',
    pullStoppedAt: '2018-12-08T19:51:40.567Z',
    updatedAt: '2018-12-08T19:51:40.567Z',
    taskArn: 'arn:aws:ecs:us-east-1:064143131841:task/845bdcb25e2d4e008a3370094a309636',
    taskDefinitionArn: 'arn:aws:ecs:us-east-1:064143131841:task-definition/sb-taskdef:32',
    version: 2
  }
}