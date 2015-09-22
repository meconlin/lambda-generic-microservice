# load envs
. envs.sh

# zip everything
cd ..
zip -r index.zip index.js config.js package.json node_modules/*

# SETUP
# create lambda function, role, role-policy
#
# Depends on:
#    AWS CLI version aws-cli/1.7.42 Python/2.7.5 Darwin/13.4.0
#
#    ~.aws/
#    contains credentials with:
#    - create/delete roles permissions
#    - create/delete lambda permissions
#
# index.zip contains your
#    - index.js
#    - config.js
#    - node_modules/*
#
# zip -r index.zip index.js config.js node_modules/*

echo "Starting setup"
echo "-------------------------------------"
echo "Will create: "
echo "function : $function"
echo "role : $lambda_execution_role_name"
echo "policy : $lambda_execution_access_policy_name"
echo "-------------------------------------"


echo "Create Role"
lambda_execution_role_arn=$(aws iam create-role \
  --role-name "$lambda_execution_role_name" \
  --assume-role-policy-document '{
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "",
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    }' \
  --output text \
  --query 'Role.Arn'
)

lambda_execution_role_arn=$lambda_execution_role_arn
echo "role created (arn) : $lambda_execution_role_arn"

echo "Create Policy"
aws iam put-role-policy \
  --role-name "$lambda_execution_role_name" \
  --policy-name "$lambda_execution_access_policy_name" \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "logs:*"
            ],
            "Effect": "Allow",
            "Resource": "arn:aws:logs:*:*:*"
        },
        {
          "Action": [
            "dynamodb:DeleteItem",
            "dynamodb:GetItem",
            "dynamodb:PutItem",
            "dynamodb:Query",
            "dynamodb:Scan",
            "dynamodb:UpdateItem"
          ],
          "Effect": "Allow",
          "Resource": "*"
        }
    ]
}'

echo "Waiting a few for create to catch up....."
# wait a sec, the policy sometimes takes a sec
#
sleep 5

echo "Done sleeping...."

echo "Upload zip package index.zip.."
#Timeout increased from walkthrough based on experience
aws lambda create-function \
  --function-name $function \
  --description "$description" \
  --zip-file fileb://index.zip \
  --role $lambda_execution_role_arn \
  --handler index.handler \
  --timeout 30 \
  --runtime nodejs


## TODO :
##     setup event notifcation rules
##     CLI doesnt allow yet!


echo "--------------------------------------"
echo "Done setup"
