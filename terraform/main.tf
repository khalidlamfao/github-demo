# Root main.tf
module "network" {
  source = "./modules/network"
}

module "rds" {
  source = "./modules/rds"
  vpc_id = module.network.vpc_id
  subnet_ids = module.network.private_subnet_ids
}

module "ecs" {
  source = "./modules/ecs"
  vpc_id         = module.network.vpc_id
  public_subnets = module.network.public_subnet_ids
  db_config = {
    host     = module.rds.db_host
    username = module.rds.db_username
    password = module.rds.db_password
    database = module.rds.db_name
  }
}

provider "aws" {
  region = var.region
}

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }
  required_version = ">= 1.3.0"
}

# Variables & Outputs defined in separate files

