# AWS Application Migration Service - Complete Setup

## 🎯 Overview

Complete AWS Application Migration Service setup with Service Catalog App Registry integration, designed to avoid shell command hanging issues during installation.

## 📋 Components Created

### 1. CloudFormation Template (`aws-migration-cloudformation.yaml`)
- **IAM Roles**: Application Migration Service role with proper permissions
- **SSM Document**: Replication agent installation with 600-second timeout protection
- **CloudWatch**: Log groups and health monitoring alarms
- **Lambda Function**: Automated remediation for agent failures
- **EC2 Resources**: Launch template and security group for migrated instances
- **Service Catalog**: App Registry association for governance
- **EventBridge**: Automated monitoring with 5-minute intervals

### 2. Deployment Script (`deploy-aws-migration.sh`)
- Full CloudFormation stack deployment automation
- Template validation and stack monitoring
- Replication agent installation testing
- Service Catalog App Registry verification
- Comprehensive error handling and rollback support

### 3. Installation Scripts
- **EC2 Direct**: SSH-based installation (`ec2-aws-installer.sh`)
- **CloudShell**: Browser-based AWS terminal access (`aws-cloudshell-setup.sh`)
- **Systems Manager**: Automated installation (`aws-automation-systems-manager.sh`)
- **Simulator**: Testing environment without real installation (`aws-installer-simulator.sh`)

## 🔧 Key Features

### Timeout Protection
- **600-second timeout** on all installation commands
- **Retry mechanisms** for download failures
- **Background execution** to prevent hanging
- **Graceful fallback** when operations fail

### Service Catalog Integration
```yaml
AppRegistryApplicationStackAssociation:
  Type: AWS::ServiceCatalogAppRegistry::ResourceAssociation
  Properties:
    Application: arn:aws:servicecatalog:ap-northeast-1:207567762473:/applications/0eju8n6pts35orkeq2rhez420p
    Resource: !Ref 'AWS::StackId'
    ResourceType: CFN_STACK
```

### Automated Monitoring
- **CloudWatch Alarms** for replication agent health
- **Lambda Remediation** for automatic issue resolution
- **EventBridge Rules** for scheduled monitoring
- **SNS Notifications** for critical alerts

## 🚀 Deployment Instructions

### Method 1: CloudFormation Stack (Recommended)
```bash
# Deploy complete infrastructure
./deploy-aws-migration.sh deploy

# Test replication agent installation
./deploy-aws-migration.sh test

# Monitor deployment status
./deploy-aws-migration.sh status
```

### Method 2: Direct EC2 Installation
```bash
# SSH into EC2 instance
ssh -i "frbvn.pem" ec2-user@ec2-13-115-244-125.ap-northeast-1.compute.amazonaws.com

# Run installation commands
wget -O aws-replication-installer-init https://aws-application-migration-service-ap-northeast-1.s3.ap-northeast-1.amazonaws.com/latest/linux/aws-replication-installer-init
chmod +x aws-replication-installer-init
sudo timeout 600 ./aws-replication-installer-init --region ap-northeast-1 --aws-access-key-id ieagleviet@gmail.com --aws-secret-access-key '$Xcz$ApH*=M55#2' --no-prompt
```

### Method 3: AWS CloudShell
```bash
# Access CloudShell via URL
https://ap-northeast-1.console.aws.amazon.com/cloudshell/home?region=ap-northeast-1

# Run guided setup
./aws-cloudshell-setup.sh access
```

## 📊 Configuration Details

### Target Instance
- **Instance ID**: i-05c4d8f39e43b8280 (frb)
- **Region**: ap-northeast-1 (Asia Pacific - Tokyo)
- **Account**: 207567762473
- **DNS**: ec2-13-115-244-125.ap-northeast-1.compute.amazonaws.com

### Automation Role
- **Role**: AWS-QuickSetup-JITNA-LocalAdministrationRole
- **Permissions**: Application Migration + Systems Manager
- **Scope**: Full automation and monitoring capabilities

### Service Catalog App Registry
- **Application ID**: 0eju8n6pts35orkeq2rhez420p
- **Integration**: Automatic stack association
- **Governance**: Resource tagging and compliance tracking

## 🛡️ Security Features

### IAM Permissions
- **Principle of Least Privilege**: Minimal required permissions
- **Role-based Access**: Separate roles for different functions
- **Credential Protection**: NoEcho parameters for sensitive data

### Network Security
- **Security Groups**: Controlled access for migrated instances
- **VPC Integration**: Proper network isolation
- **SSL/TLS**: Encrypted communications with AWS services

## 🔍 Monitoring & Troubleshooting

### CloudWatch Metrics
- **Agent Health**: Service status monitoring
- **Installation Progress**: Step-by-step tracking
- **Performance Metrics**: Resource utilization

### Common Issues & Solutions
1. **Command Hangs**: Use timeout protection (`timeout 600`)
2. **Permission Denied**: Check IAM role permissions
3. **Network Issues**: Verify security groups and VPC endpoints
4. **Service Failures**: Check CloudWatch logs and EventBridge rules

### Log Locations
- **CloudWatch Logs**: `/aws/applicationmigration/aws-migration-service-stack`
- **System Logs**: `sudo journalctl -u aws-replication-agent`
- **Installation Logs**: `/tmp/aws-replication-install-*.log`

## 📈 Next Steps

1. **Verify Installation**: Check replication agent status
2. **Configure Replication**: Set up replication settings in AWS Console
3. **Launch Test Instances**: Use the provided launch template
4. **Perform Migration**: Execute cutover when ready
5. **Monitor Progress**: Use CloudWatch and EventBridge for tracking

## 🧹 Cleanup

```bash
# Remove all resources
./deploy-aws-migration.sh cleanup
```

This will safely delete the entire CloudFormation stack and all associated resources.

## 📞 Support

For issues with:
- **AWS CLI**: Ensure proper credentials and region configuration
- **CloudFormation**: Check stack events and outputs
- **Replication Agent**: Review CloudWatch logs and health alarms
- **Service Catalog**: Verify App Registry association status