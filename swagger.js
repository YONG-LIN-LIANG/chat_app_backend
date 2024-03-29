export default {
  "openapi": "3.0.0",
  "info": {
    "version": "1.0.0",
    "title": "chat_app_backend",
    "description": "Handle requests from chat app socket server and interact with database."
  },
  "servers": [
    {
      "url": "http://172.18.48.177:3002/",
      "description": "Steven node server"
    }
  ],
  "tags": [
    {
      "name": "member",
      "description": "Member Controller Api"
    },
    {
      "name": "client",
      "description": "Client Controller Api"
    },
    {
      "name": "question",
      "description": "Question Controller Api"
    },
    {
      "name": "customer service",
      "description": "Customer service Controller Api"
    },
    {
      "name": "room",
      "description": "Room Controller Api"
    },
    {
      "name": "token",
      "description": "Token Controller Api"
    }
  ],
  "paths": {
    "/room/pair": {
      "post": {
        "tags": [
          "room"
        ],
        "summary": "Create a pair",
        "consumes": [
          "application/json"
        ],
        "requestBody": {
          "description": "Create a pair",
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/definitions/pair"
              }
            }
          }
        },
        "produces": [
          "application/json"
        ],
        "responses": {
          "201": {
            "description": "房間建立成功"
          },
          "400": {
            "description": "此會員已在房間內"
          }
        }
      }
    },
    "/room/message": {
      "get": {
        "tags": [
          "room"
        ],
        "summary": "Get room message for client and cs",
        "parameters": [
          {
            "in": "query",
            "name": "client_id",
            "schema": {
              "type": "integer"
            },
            "required": true,
            "description": "client_id為客戶端id(必填)"
          },
          {
            "in": "query",
            "name": "resource_id",
            "schema": {
              "type": "integer"
            },
            "required": false,
            "description": "resource_id為來源id(選填)"
          }
        ],
        "consumes": [
          "application/json"
        ],
        "produces": [
          "application/json"
        ],
        "responses": {
          "200": {
            "description": "取得成功"
          },
          "204": {
            "description": "無匹配資料"
          }
        }
      }
    },
    "/member/client/add": {
      "post": {
        "tags": [
          "member"
        ],
        "summary": "Create a new User",
        "consumes": [
          "application/json"
        ],
        "requestBody": {
          "description": "Create a new member",
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/definitions/member"
              }
            }
          }
        },
        "produces": [
          "application/json"
        ],
        "responses": {
          "201": {
            "description": "新增成功"
          },
          "400": {
            "description": "格式錯誤"
          }
        }
      }
    },
    "/member/resource/{resource_id}": {
      "get": {
        "tags": [
          "member"
        ],
        "summary": "Get group and website of member.",
        "parameters": [
          {
            "in": "path",
            "name": "resource_id",
            "schema": {
              "type": "integer"
            },
            "required": true,
            "description": "resource_id為客戶端id(必填)"
          }
        ],
        "consumes": [
          "application/json"
        ],
        "produces": [
          "application/json"
        ],
        "responses": {
          "200": {
            "description": "取得成功"
          },
          "204": {
            "description": "無任何訊息"
          }
        }
      }
    },
    "/client/cs/recent": {
      "get": {
        "tags": [
          "client"
        ],
        "summary": "Get client recent customer service",
        "parameters": [
          {
            "in": "query",
            "name": "member_id",
            "schema": {
              "type": "integer"
            },
            "required": true,
            "description": "member_id為客戶端id(必填)"
          },
          {
            "in": "query",
            "name": "resource_id",
            "schema": {
              "type": "integer"
            },
            "required": true,
            "description": "resource_id為來源id(必填)"
          }
        ],
        "consumes": [
          "application/json"
        ],
        "produces": [
          "application/json"
        ],
        "responses": {
          "200": {
            "description": "取得成功"
          },
          "204": {
            "description": "無匹配資料"
          }
        }
      }
    },
    "/question": {
      "get": {
        "tags": [
          "question"
        ],
        "summary": "Get question info",
        "parameters": [
          {
            "in": "query",
            "name": "question_id",
            "schema": {
              "type": "integer"
            },
            "required": true,
            "description": "question_id為問題id(必填)"
          },
          {
            "in": "query",
            "name": "resource_id",
            "schema": {
              "type": "integer"
            },
            "required": true,
            "description": "resource_id為網站來源id(必填)"
          }
        ],
        "consumes": [
          "application/json"
        ],
        "produces": [
          "application/json"
        ],
        "responses": {
          "200": {
            "description": "取得成功"
          },
          "204": {
            "description": "此來源網站無標籤"
          }
        }
      }
    },
    "/cs/room/list/{cs_id}": {
      "get": {
        "tags": [
          "customer service"
        ],
        "summary": "Get user room list",
        "parameters": [
          {
            "in": "path",
            "name": "cs_id",
            "schema": {
              "type": "integer"
            },
            "required": true,
            "description": "cs_id為客服會員id(必填)"
          }
        ],
        "consumes": [
          "application/json"
        ],
        "produces": [
          "application/json"
        ],
        "responses": {
          "200": {
            "description": "取得清單成功"
          },
          "204": {
            "description": "無任何項目"
          }
        }
      }
    },
    "/token/login": {
      "post": {
        "tags": [
          "token"
        ],
        "summary": "Employee login",
        "consumes": [
          "application/json"
        ],
        "requestBody": {
          "description": "Employee login",
          "required": true,
          "content": {
            "application/json": {
              "schema": {
                "$ref": "#/definitions/token-login"
              },
              "examples": {
                "account": {
                  "summary": "範例一",
                  "value": {
                    "account": "tkb0004412",
                    "password": "12345667"
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "definitions": {
    "member": {
      "type": "object",
      "properties": {
        "uuid": {
          "type": "string"
        },
        "name": {
          "type": "string"
        },
        "identity": {
          "type": "number"
        }
      }
    },
    "token-login": {
      "type": "object",
      "properties": {
        "account": {
          "type": "string"
        },
        "password": {
          "type": "string"
        }
      }
    }
  }
}