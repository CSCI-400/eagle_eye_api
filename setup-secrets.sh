#!/bin/bash
# Script to create secrets in Google Cloud Secret Manager for Firebase App Hosting
# Run this script once to set up your secrets

# Set your Google Cloud project ID
PROJECT_ID="eagleeye-e31ac"

echo "Setting up secrets for project: $PROJECT_ID"

# Create FIREBASE_API_KEY secret
echo "Creating FIREBASE_API_KEY secret..."
echo -n "AIzaSyCAQkSykCX3EYF1ZbzLiqvRDoGMWX7hdUE" | \
  gcloud secrets create FIREBASE_API_KEY \
  --project=$PROJECT_ID \
  --data-file=- \
  --replication-policy="automatic" || \
  echo "FIREBASE_API_KEY secret already exists, updating..."

# If secret exists, add a new version
echo -n "AIzaSyCAQkSykCX3EYF1ZbzLiqvRDoGMWX7hdUE" | \
  gcloud secrets versions add FIREBASE_API_KEY \
  --project=$PROJECT_ID \
  --data-file=-

# Create FIREBASE_SERVICE_ACCOUNT secret
echo "Creating FIREBASE_SERVICE_ACCOUNT secret..."
cat <<'EOF' | gcloud secrets create FIREBASE_SERVICE_ACCOUNT \
  --project=$PROJECT_ID \
  --data-file=- \
  --replication-policy="automatic" || \
  echo "FIREBASE_SERVICE_ACCOUNT secret already exists, updating..."
{"type":"service_account","project_id":"eagleeye-e31ac","private_key_id":"fd2abe4b8edc8b16be80d4b1bb6ec51bda1de26a","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCR4Nir4VA9FQGS\nggT1MKjth2DGK2WTZmKF8WIJdAgQX6BE/UP32W59K9byaLP0gDprZeuGRZUrRhEq\n8nFtLf4xEInPsvfZLgHdbAU6yTIXfdUGfow3W1slSMa/XqZVjzHekBIxLN2yFNCW\nVHSusqNmal0oZUwvhWWoBjTpGsxlmOnv/es6Rj+CPCz3u6o1kc8m4GaSR1CTB8z3\nefo3eltj8cQ/AHwwG7K/t/rv1WKU8lHfk89blMVT3OdF7zgbXSAVhGQotWp8c1le\ne4XcnnJDkrYq6tDZ36il5DP7NWQseP+YY6ByNEL/xRejB4r670Whz803CfrYcrpT\nnqsGFu3rAgMBAAECggEAR1Qm/dw87LERxL54iB9T6ljws9VSZIGCmTXPFwo6Sy9G\n4ZTpIA6cHO5LutoBbAMrDYqXYF8zsiYfjN1hIt6DVSBeEkXTNMlvNgJ0iCsKqDvp\n5rQIAaVU6uUr8TTpphpPayENFCh4+nN9DpSbPTSx+wj1JiRp3S6f50mpo3VsDhy6\n9qxMMX0RNTg40lO95ZX8k2S915HvLwt8YPHNxCGSYCzRKo/ZyHnfbrthjG3zeeJg\nKTH1dhBPwNkOUIoP70qflnV7+WcpGnSRLaEZiAPxrSF/NHQrwzSK7NUM+nW6m2PQ\nPIO6Gra7HqLhwQvGrArYSV+/95CTmUfs7CXjV/YHuQKBgQDFlkTWvYTjW9yYcSRR\nVbu0T6f/8phgxIbyXGqR+EwYFVSEK1ys/Asx6yQhnid+XNXIi6tkzFFVWidy00+p\n7ZJGulbTf11chNh4yZjj0fpXpO6oiqVNiEVj/kOtB2GQvM8C2PQZxNTZkl0Xp/6q\nv2uQg+oRbT+kBu9HkF8VLEixXwKBgQC9ASxkFMNyjFCHbYKM9V//ZXEYYyVxriCk\nT4RXUbIrW9mgbRsebOQsn7u8DLty/NwnlKXbSfZzfTzEbTAZrxHzNQfzVObRV/Gz\nvTPON/EHv+eYdpVJfC4nuXdWriTOuMw89XjR75W8nIgu/LEtb/bvUC2rbscsnWof\nTa/tbMOS9QKBgHRIzda7zvun0pn87GzZ0hB6WNsvQTKiNvFoJmgmA1KhKw5mHrLH\n2ybTxn3qgD/EDyVp3cMC5FMhLdpMNrRBVzc872ClsqKCpIvhyZM6vuTZ8oNKpaKN\nspj4yYeJsofmNsbsPCz2RHaPxy3m9uAyq/FvUVBURYIZerVZaDwjxdxtAoGAROua\nnlwb8TdNXjUGuBP6D42UMgplaxDOAlykq5q0167EqwVeMDgQ9FzC/o2+BO5D8YL4\n///2iKKQeChAs/ztFLyvy4GYMZpaHurNa1Nm5yaJc0U6pvNLeVzeMZOLBH7Kqyfw\nCM3O0lpaJpgqm6EKcLXSEYNxyckVG5ken/tbTckCgYEAoo5l7bqDQI6wFZBWfmRK\nDBDw9zSPzoxoJ1a0dPSIuzswU/qKiXzww0rfv4cL2CgFbLZ0Jm5+Gdh5ijsVOrZv\nmUOjTlXhA4wGvchtzK162uVTjInsYxi8Q7CavQFl1svdRkN4trDdfuhNthxtmZes\nn1HFGrjmc7lnX+debBl9yQg=\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@eagleeye-e31ac.iam.gserviceaccount.com","client_id":"107541739181554310328","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40eagleeye-e31ac.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
EOF

# If secret exists, add a new version
cat <<'EOF' | gcloud secrets versions add FIREBASE_SERVICE_ACCOUNT \
  --project=$PROJECT_ID \
  --data-file=-
{"type":"service_account","project_id":"eagleeye-e31ac","private_key_id":"fd2abe4b8edc8b16be80d4b1bb6ec51bda1de26a","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCR4Nir4VA9FQGS\nggT1MKjth2DGK2WTZmKF8WIJdAgQX6BE/UP32W59K9byaLP0gDprZeuGRZUrRhEq\n8nFtLf4xEInPsvfZLgHdbAU6yTIXfdUGfow3W1slSMa/XqZVjzHekBIxLN2yFNCW\nVHSusqNmal0oZUwvhWWoBjTpGsxlmOnv/es6Rj+CPCz3u6o1kc8m4GaSR1CTB8z3\nefo3eltj8cQ/AHwwG7K/t/rv1WKU8lHfk89blMVT3OdF7zgbXSAVhGQotWp8c1le\ne4XcnnJDkrYq6tDZ36il5DP7NWQseP+YY6ByNEL/xRejB4r670Whz803CfrYcrpT\nnqsGFu3rAgMBAAECggEAR1Qm/dw87LERxL54iB9T6ljws9VSZIGCmTXPFwo6Sy9G\n4ZTpIA6cHO5LutoBbAMrDYqXYF8zsiYfjN1hIt6DVSBeEkXTNMlvNgJ0iCsKqDvp\n5rQIAaVU6uUr8TTpphpPayENFCh4+nN9DpSbPTSx+wj1JiRp3S6f50mpo3VsDhy6\n9qxMMX0RNTg40lO95ZX8k2S915HvLwt8YPHNxCGSYCzRKo/ZyHnfbrthjG3zeeJg\nKTH1dhBPwNkOUIoP70qflnV7+WcpGnSRLaEZiAPxrSF/NHQrwzSK7NUM+nW6m2PQ\nPIO6Gra7HqLhwQvGrArYSV+/95CTmUfs7CXjV/YHuQKBgQDFlkTWvYTjW9yYcSRR\nVbu0T6f/8phgxIbyXGqR+EwYFVSEK1ys/Asx6yQhnid+XNXIi6tkzFFVWidy00+p\n7ZJGulbTf11chNh4yZjj0fpXpO6oiqVNiEVj/kOtB2GQvM8C2PQZxNTZkl0Xp/6q\nv2uQg+oRbT+kBu9HkF8VLEixXwKBgQC9ASxkFMNyjFCHbYKM9V//ZXEYYyVxriCk\nT4RXUbIrW9mgbRsebOQsn7u8DLty/NwnlKXbSfZzfTzEbTAZrxHzNQfzVObRV/Gz\nvTPON/EHv+eYdpVJfC4nuXdWriTOuMw89XjR75W8nIgu/LEtb/bvUC2rbscsnWof\nTa/tbMOS9QKBgHRIzda7zvun0pn87GzZ0hB6WNsvQTKiNvFoJmgmA1KhKw5mHrLH\n2ybTxn3qgD/EDyVp3cMC5FMhLdpMNrRBVzc872ClsqKCpIvhyZM6vuTZ8oNKpaKN\nspj4yYeJsofmNsbsPCz2RHaPxy3m9uAyq/FvUVBURYIZerVZaDwjxdxtAoGAROua\nnlwb8TdNXjUGuBP6D42UMgplaxDOAlykq5q0167EqwVeMDgQ9FzC/o2+BO5D8YL4\n///2iKKQeChAs/ztFLyvy4GYMZpaHurNa1Nm5yaJc0U6pvNLeVzeMZOLBH7Kqyfw\nCM3O0lpaJpgqm6EKcLXSEYNxyckVG5ken/tbTckCgYEAoo5l7bqDQI6wFZBWfmRK\nDBDw9zSPzoxoJ1a0dPSIuzswU/qKiXzww0rfv4cL2CgFbLZ0Jm5+Gdh5ijsVOrZv\nmUOjTlXhA4wGvchtzK162uVTjInsYxi8Q7CavQFl1svdRkN4trDdfuhNthxtmZes\n1HFGrjmc7lnX+debBl9yQg=\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-fbsvc@eagleeye-e31ac.iam.gserviceaccount.com","client_id":"107541739181554310328","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40eagleeye-e31ac.iam.gserviceaccount.com","universe_domain":"googleapis.com"}
EOF

echo "Secrets setup complete!"
echo "Your secrets are now stored in Google Cloud Secret Manager and will be used during deployment."
