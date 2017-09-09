This service can be deployed as part of App Engine free tier. For details:
https://cloud.google.com/free/docs/always-free-usage-limits

1. Sign up for http://console.cloud.google.com/ and create a new project.

2.  Install [Google Cloud SDK](https://cloud.google.com/sdk/downloads)

```
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
gcloud init
```

3. Deploy mock services

```
git clone https://github.com/cds-hooks/sandbox
cd sandbox/mock-cds-backend
git checkout jmandel/for-deploy
gcloud app deploy
```
