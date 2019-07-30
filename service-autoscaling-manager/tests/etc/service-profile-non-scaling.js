module.exports = {
  ServiceName: 'sb-service',
  ServiceArn: 'arn:aws:ecs:us-east-1:064143131841:service/sb-cluster/sb-service',
  DesiredCount: 2,
  Scalable: false,
  Task: {
    DefinitionArn: 'arn:aws:ecs:us-east-1:064143131841:task-definition/sb-taskdef:33',
    Cpu: 900,
    Mem: 950,
    ContainersCpu: 550,
    ContainersMem: 700,
    ContainersMemReservation: 384
  }
};