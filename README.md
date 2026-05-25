# 买不买事务所 MVP

消费前冷静判断工具，面向移动端优先的 Web App。

## 本地运行

```bash
npm install
npm run dev
```

## 目录结构

```text
src/
  components/  通用 UI 组件
  data/        表单选项与静态配置
  pages/       页面模块
  utils/       金额计算、钱包血条、审判规则
  App.jsx      页面组织与导航
  main.jsx     应用入口
  styles.css   全局样式
```

## MVP 存储策略

首版使用浏览器本地存储保存钱包状态、购物案件、冷静清单和战绩。
