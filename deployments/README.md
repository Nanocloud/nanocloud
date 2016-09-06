# Nanocloud deployments

This directory is a collection of tools to deploy Nanocloud.

## Install with ansible

You need ansible 1.9 or above to use this installation

Install dependencies

```
ansible-galaxy install franklinkim.docker
ansible-galaxy install franklinkim.docker-compose
```

> Note: You may need to have root privilege to install those dependencies. You
> won't need it to run deployment.

### Configure

Configure where *ansible* will deploy your installation by modifying
*ansible_hosts* file.

```
[nanocloud]
api ansible_host=127.0.0.1
```

In this file, you can specify several server and give name to them to deploy
multiple instance of nanocoud:

```
[nanocloud]
api-instance1 ansible_host=10.0.0.2
api-customerX ansible_host=10.0.0.3
```

Use the file *deployments/roles/nanocloud/files/nanocloud/config.env* to
override configuration variable like you should normally do with *config.env*
file

### Run

Run Playbook

```
ansible-playbook nanocloud.yml
```

## Run multiple instance on a same host

Script *deploy-pr.sh* is here to help you deploy a specific Github Pull Request
on any environement without closing another instance.

You can deploy several PR in a single machine. Each deployment will have its
own *database*, *frontend*, *backend* and *guacamole-client*.

To use it, run the following command:

```
./deployments/deploy-pr.sh ${PR_NUMBER}
```

And if the remote is note called *origin* you can specify another name:

```
./deployments/deploy-pr.sh 175 base
```
