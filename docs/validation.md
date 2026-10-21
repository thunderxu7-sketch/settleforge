# 验收记录

验证日期：2026-10-21。环境：macOS arm64、Go 1.27.3、Colima / Docker、PostgreSQL 18、Bitcoin Core 30.2、SoftHSM 2.7.0。

## 已运行

| 验收 | 结果 | 复现入口 |
|---|---|---|
| PostgreSQL 并发冻结 | 100 个并发请求从余额 100 提现 2，只接受 50 个 | `TestConcurrentWithdrawalsCannotOverspend` |
| 充值去重、参数冲突与确认 | 未确认不入账；确认后一次；参数变化冲突 | `TestDepositConfirmationDedupAndConflictingReplay` |
| 审批绑定 | 修改指令字段、相同 actor 重复、审批不足被拒绝 | signing / signer tests |
| 广播未知与恢复 | 保留原交易和冻结；重建模拟器后确认；重复结算仅一个 journal | `TestUnknownBroadcastRestartAndExactlyOnceSettlement` |
| 归集与负债 | 归集不改变用户负债，静止状态对账差额为零 | `TestSweepDoesNotChangeUserLiabilityAndReconciles` |
| 账本约束 | 非平衡 journal 和账本修改被 PostgreSQL 拒绝 | `TestLedgerRejectsUnbalancedAndMutableRecords` |
| 真实 BTC 充提与归集 | 新地址、充值扫描去重、PSBT 签名、Core mempool 接纳、2 次确认、结算与对账 | `TestBitcoinCoreRegtestDepositWithdrawSweepReorg` |
| BTC 重组与重新出现 | invalidateblock 后冲正并隔离；重新挖块后以新 generation 入账 | 同上 |
| MPC 实际协议 | 新鲜 2/3 DKG、两方签名校验成功、单方配置被拒绝 | `go run ./cmd/mpclab --generate` |
| MPC → BTC | 门限 Provider 签名的提现交易进入 Core 并完成确认 | `TEST_SIGNER_MODE=mpc make test-bitcoin` |
| PKCS#11 | SoftHSM 生成 secp256k1，签名有效、不可导出属性、错误 PIN 拒绝 | `TestPKCS11SoftHSMRealSignatureAndNonExtractable` |
| PKCS#11 → BTC | 令牌私钥签名的提现交易进入 Core 并完成确认 | `TEST_SIGNER_MODE=pkcs11 make test-bitcoin` |
| 独立 signer | 两份审批、钱包密钥绑定、payload 重验、持久去重、认证 | `TestIndependentSignerApprovalBindingsTamperingAndDurableReplay` |
| Nitro 校验器 | 测试 CA 正例；AWS 根拒绝测试 CA；篡改、错误 PCR、公钥、nonce、策略、过期、重放均拒绝 | `TestNitroCOSETrustFreshnessPCRBindingReplay` |
| 插件构建 | webpack 成功，历史依赖和 bundle 大小警告保留 | `pnpm run build:prd:chrome` |
| HTTP 全流程 | 模拟 TRON 充值去重、幂等提现、双人审批、广播未知恢复、归集、用户余额及零差额对账 | `python3 scripts/demo.py` |

Core 验收中的部分真实 regtest 交易 ID（只属于本地链，不可在主网浏览器查询）：

```text
MPC withdrawal 793988399d152d0ad7587c196146325d321b603b1589cec22ae7e9cb671f1c4c
MPC sweep      00642c0a193bfefeec81e8a156a6dce73a4cfee6dd619fccc9df59e062e7a73e
HSM withdrawal 41867b5330bab7b0028af0c727664c7409ebdf1b0be01549e1c6c45bd26c66b9
HSM sweep      882e4d3c668755210610a7e63940bb87ecfbb83bfc82ea5f06aaa5caa34715a6
```

测试会生成新地址与交易 ID，复跑结果不会相同。测试 schema、密钥和分片不提交 Git。全套 `-race` 验收通过；CI 工作流在每次 push 后重新运行，不以本地结果替代远端结果。

## 尚未验证或实现

- Nitro 真机证明、enclave 内签名与 KMS RecipientAttestation。
- 物理 HSM、MPC 跨机隔离与生产备份恢复。
- TRON / EVM 托管真实 RPC、代币充值解析与生产多链部署。
- BTC 自动 RBF / CPFP、动态费率、已终态提现及平台注资的完整重组补偿。
- 有在途交易时的全局一致对账、生产压测、SLA、独立安全审计。
- 插件与托管后台的产品集成、完整浏览器交互回归及旧依赖升级。

简历可以写“已实现并验证的个人开源项目”，不应把这些结果写成历史雇主的生产托管资金经历。
