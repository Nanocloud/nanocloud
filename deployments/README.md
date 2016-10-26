# Nanocloud deployments

This directory is a collection of tools to deploy Nanocloud.

## Install with ansible

### Dependencies

You need ansible 1.9 or above to use this installation

Install dependencies

```
ansible-galaxy install franklinkim.docker
ansible-galaxy install franklinkim.docker-compose
```

> Note: You may need to have root privilege to install those dependencies. You
> won't need it to run deployment.

### Configure

Configure where *ansible* will deploy your installation by modifying the
*ansible_hosts* file.

```
[nanocloud]
api ansible_host=127.0.0.1 ansible_user=user
```

In this file, you can specify several servers and give name to them to deploy
multiple instances of Nanocloud:

```
[nanocloud]
api-instance1 ansible_host=10.0.0.2 ansible_user=user1
api-customerX ansible_host=10.0.0.3 ansible_user=user2
```

Use the file *deployments/roles/nanocloud/files/nanocloud/config.env* to
override configuration variable like you should normally do with the *config.env*
file

### Run

Run Playbook

```
ansible-playbook nanocloud.yml
```

## Run multiple instance on a same host

The script *deploy-pr.sh* is here to help you deploy a specific Github Pull Request
on any environment in parallel.

You can deploy several PR on a single machine. Each deployment will have its
own *database*, *frontend*, *backend* and *guacamole-client*.

To use it, run the following command:

```
./deployments/deploy-pr.sh ${PR_NUMBER}
```

And if the remote is not called *origin* you can specify another name:

```
./deployments/deploy-pr.sh 175 base
```
