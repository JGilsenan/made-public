module.exports = {
  acct: '064143131841',
  clusterArn: 'arn:aws:ecs:us-east-1:064143131841:cluster/sb-cluster',
  clusterName: 'sb-cluster',
  taskArn: 'arn:aws:ecs:us-east-1:064143131841:task/845bdcb25e2d4e008a3370094a309636',
  taskDefArn: 'arn:aws:ecs:us-east-1:064143131841:task-definition/sb-taskdef:33',
  taskDef: 'sb-taskdef:33',
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
    Task: {
      DefinitionArn: 'arn:aws:ecs:us-east-1:064143131841:task-definition/sb-taskdef:33',
      Cpu: 900,
      Mem: 950,
      ContainersCpu: 550,
      ContainersMem: 700,
      ContainersMemReservation: 384
    },
  }
};