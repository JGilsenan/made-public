module.exports = {
  taskDefinition:
  {
    taskDefinitionArn:
      'arn:aws:ecs:us-east-1:064143131841:task-definition/sb-taskdef:35',
    containerDefinitions: [
      {
        name: 'sb-app-container',
        image:
          '064143131841.dkr.ecr.us-east-1.amazonaws.com/sb-repo:latest',
        cpu: 300,
        memory: 300,
        memoryReservation: 128,
        links: [],
        portMappings: [[Object]],
        essential: true,
        entryPoint: [],
        command: [],
        environment: [],
        mountPoints: [],
        volumesFrom: [],
        disableNetworking: false,
        dnsServers: [],
        dnsSearchDomains: [],
        dockerSecurityOptions: [],
        logConfiguration: { logDriver: 'none' }
      }
    ],
    family: 'sb-taskdef',
    networkMode: 'bridge',
    revision: 35,
    volumes: [],
    status: 'ACTIVE',
    requiresAttributes: [[Object], [Object], [Object], [Object]],
    placementConstraints: [],
    compatibilities: ['EC2'],
    requiresCompatibilities: ['EC2'],
    cpu: '900',
    memory: '950'
  }
}