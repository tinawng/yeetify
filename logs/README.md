# Logs Structures

## HTTP Request Trace
```
├── level
├── time
├── pid
├── hostname
└── req
    ├── method
    │   ├── user-agent
    │   ├── accept
    │   ├── accept-encoding
    │   ├── accept-language
    │   ├── referer
    │   ├── host
    │   └── x-forwarded-for
    ├── remoteAddress
    └── remotePort
```

## Node Exit
```
├── level
├── time
├── pid
├── hostname
└── msg
```