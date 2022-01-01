(ns portfolio-service-clojure.core-test
  (:require [clojure.test :refer :all]
            [portfolio-service-clojure.core :refer :all]))

(deftest getHelloWorld-test
  (testing "getHelloWorld function test"
    (is (= (getHelloWorld) "Hello, World Test!"))))