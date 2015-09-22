. envs.sh

echo "Starting teardown"
echo "-------------------------------------"
echo "Will delete: "
echo "function : $function"
echo "role : $lambda_execution_role_name"
echo "policy : $lambda_execution_access_policy_name"
echo "-------------------------------------"

aws lambda delete-function \
  --function-name "$function"

aws iam delete-role-policy \
  --role-name "$lambda_execution_role_name" \
  --policy-name "$lambda_execution_access_policy_name"

aws iam delete-role \
  --role-name "$lambda_execution_role_name"

echo "--------------------------------------"
echo "Done teardown "
