description="microservice for CRUD of generic dynamodb objects"
function=lambda-generic-microservice
lambda_execution_role_name=lambda-$function-execution
lambda_execution_access_policy_name=lambda-$function-execution-access
lambda_invocation_role_name=lambda-$function-invocation
lambda_invocation_access_policy_name=lambda-$function-invocation-access
log_group_name=/aws/lambda/$function
