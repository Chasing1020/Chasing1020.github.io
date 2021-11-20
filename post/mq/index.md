
```bash
rabbitmqctl add_user <username> <passwd>
rabbitmqctl set_permissions -p / <username> ".*" ".*" ".*"

rabbitmqctl set_user_tag myuser administrator
```

